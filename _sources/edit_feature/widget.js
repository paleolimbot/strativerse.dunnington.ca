
OpenLayers.Projection.addTransform("EPSG:4326", "EPSG:3857", OpenLayers.Layer.SphericalMercator.projectForward);
var geodjango_geometry = {};
geodjango_geometry.map = null; geodjango_geometry.controls = null; geodjango_geometry.panel = null; geodjango_geometry.re = new RegExp("^SRID=\\d+;(.+)", "i"); geodjango_geometry.layers = {};
geodjango_geometry.modifiable = true;
geodjango_geometry.wkt_f = new OpenLayers.Format.WKT();
geodjango_geometry.is_collection = false;
geodjango_geometry.collection_type = 'None';
geodjango_geometry.is_generic = true;
geodjango_geometry.is_linestring = false;
geodjango_geometry.is_polygon = false;
geodjango_geometry.is_point = false;

geodjango_geometry.get_ewkt = function(feat){
    return 'SRID=3857;' + geodjango_geometry.wkt_f.write(feat);
};
geodjango_geometry.read_wkt = function(wkt){
    // OpenLayers cannot handle EWKT -- we make sure to strip it out.
    // EWKT is only exposed to OL if there's a validation error in the admin.
    var match = geodjango_geometry.re.exec(wkt);
    if (match){wkt = match[1];}
    return geodjango_geometry.wkt_f.read(wkt);
};

geodjango_geometry.write_wkt = function(feat){
    if (geodjango_geometry.is_collection){ 
      geodjango_geometry.num_geom = feat.geometry.components.length;
    } else { 
      geodjango_geometry.num_geom = 1;
    }
    
    wkt = geodjango_geometry.get_ewkt(feat);
    document.getElementById('id_geometry').value = wkt;
    
    if (Shiny.setInputValue) {
      Shiny.setInputValue('id_geometry', wkt);
    }
};

geodjango_geometry.add_wkt = function(event){
    // This function will sync the contents of the `vector` layer with the
    // WKT in the text field.
    if (geodjango_geometry.is_collection){
        var feat = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Unknown());
        for (var i = 0; i < geodjango_geometry.layers.vector.features.length; i++){
            feat.geometry.addComponents([geodjango_geometry.layers.vector.features[i].geometry]);
        }
        geodjango_geometry.write_wkt(feat);
    } else {
        // Make sure to remove any previously added features.
        if (geodjango_geometry.layers.vector.features.length > 1){
            old_feats = [geodjango_geometry.layers.vector.features[0]];
            geodjango_geometry.layers.vector.removeFeatures(old_feats);
            geodjango_geometry.layers.vector.destroyFeatures(old_feats);
        }
        geodjango_geometry.write_wkt(event.feature);
    }
};

geodjango_geometry.modify_wkt = function(event){
    if (geodjango_geometry.is_collection){
        if (geodjango_geometry.is_point){
            geodjango_geometry.add_wkt(event);
            return;
        } else {
            // When modifying the selected components are added to the
            // vector layer so we only increment to the `num_geom` value.
            var feat = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Unknown());
            for (var i = 0; i < geodjango_geometry.num_geom; i++){
                feat.geometry.addComponents([geodjango_geometry.layers.vector.features[i].geometry]);
            }
            geodjango_geometry.write_wkt(feat);
        }
    } else {
        geodjango_geometry.write_wkt(event.feature);
    }
};

// Function to clear vector features and purge wkt from div
geodjango_geometry.deleteFeatures = function(){
    geodjango_geometry.layers.vector.removeFeatures(geodjango_geometry.layers.vector.features);
    geodjango_geometry.layers.vector.destroyFeatures();
};

geodjango_geometry.clearFeatures = function () {
    geodjango_geometry.deleteFeatures();
    document.getElementById('id_geometry').value = '';
    
    if (Shiny.setInputValue) {
      Shiny.setInputValue('id_geometry', '');
    }
};

// Add Select control
geodjango_geometry.addSelectControl = function(){
    var select = new OpenLayers.Control.SelectFeature(geodjango_geometry.layers.vector, {'toggle' : true, 'clickout' : true});
    geodjango_geometry.map.addControl(select);
    select.activate();
};

geodjango_geometry.enableDrawing = function(){
    geodjango_geometry.map.getControlsByClass('OpenLayers.Control.DrawFeature')[0].activate();
};

geodjango_geometry.enableEditing = function(){
    geodjango_geometry.map.getControlsByClass('OpenLayers.Control.ModifyFeature')[0].activate();
};

// Create an array of controls based on geometry type
geodjango_geometry.getControls = function(lyr){
    geodjango_geometry.panel = new OpenLayers.Control.Panel({'displayClass': 'olControlEditingToolbar'});
    geodjango_geometry.controls = [new OpenLayers.Control.Navigation()];
    if (!geodjango_geometry.modifiable && lyr.features.length) return;
    if (geodjango_geometry.is_linestring || geodjango_geometry.is_generic){
        geodjango_geometry.controls.push(new OpenLayers.Control.DrawFeature(lyr, OpenLayers.Handler.Path, {'displayClass': 'olControlDrawFeaturePath'}));
    }
    if (geodjango_geometry.is_polygon || geodjango_geometry.is_generic){
        geodjango_geometry.controls.push(new OpenLayers.Control.DrawFeature(lyr, OpenLayers.Handler.Polygon, {'displayClass': 'olControlDrawFeaturePolygon'}));
    }
    if (geodjango_geometry.is_point || geodjango_geometry.is_generic){
        geodjango_geometry.controls.push(new OpenLayers.Control.DrawFeature(lyr, OpenLayers.Handler.Point, {'displayClass': 'olControlDrawFeaturePoint'}));
    }
    if (geodjango_geometry.modifiable){
        geodjango_geometry.controls.push(new OpenLayers.Control.ModifyFeature(lyr, {'displayClass': 'olControlModifyFeature'}));
    }
};

geodjango_geometry.init = function(){
    // The options hash, w/ zoom, resolution, and projection settings.
    var options = {
      'projection' : new OpenLayers.Projection("EPSG:3857"),
      'units' : "m",
      'maxResolution' : 156543.0339,
      'maxExtent' : new OpenLayers.Bounds(-20037508,-20037508,20037508,20037508),
      'numZoomLevels' : 20
    };
    // The admin map for this geometry field.
    
    geodjango_geometry.map = new OpenLayers.Map('id_geometry_map', options);
    // Base Layer
    geodjango_geometry.layers.base = new OpenLayers.Layer.OSM("OpenStreetMap (Mapnik)");
    geodjango_geometry.map.addLayer(geodjango_geometry.layers.base);
    
    
    geodjango_geometry.bing_aerial_layer = new OpenLayers.Layer.Bing({
        name: "Bing Aerial",
        type: "Aerial",
        key: "Aut49nhp5_Twwf_5RHF6wSGk7sEzpcSA__niIXCHowQZLMeC-m8cdy7EmZd2r7Gs"
    });
    geodjango_geometry.bing_streets_layer = new OpenLayers.Layer.Bing({
        name: "Bing Streets",
        type: "Road",
        key: "Aut49nhp5_Twwf_5RHF6wSGk7sEzpcSA__niIXCHowQZLMeC-m8cdy7EmZd2r7Gs"
    });
    geodjango_geometry.map.addControl(new OpenLayers.Control.MousePosition({
        displayProjection: new OpenLayers.Projection("EPSG:4326")
    }));
    // need to enable billing for this to work in this context
    // geodjango_geometry.google_aerial_layer = new OpenLayers.Layer.Google(
    //     "Google Satellite",
    //     {type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22}
    // );


    geodjango_geometry.map.addLayer(geodjango_geometry.bing_aerial_layer);
    geodjango_geometry.map.addLayer(geodjango_geometry.bing_streets_layer);

    var $results = $('#id_geometry_admin_map_search_results');
    $("#id_geometry_admin_map_search_clear").on("click", function(e) {
        e.preventDefault();
        $results.html('');
        $('#id_geometry_admin_map_search').val('');
    });

    var panAndSet = function($results, lon, lat) {
        if(lon > 180 || lon < -180) {
            $results.html('<span class="error">Longitude out of range</span>');
            return;
        } else if(lat > 90 || lat < -90) {
            $results.html('<span class="error">Latitude out of range</span>');
            return;
        }

        var map = geodjango_geometry.map;
        var proj = new OpenLayers.Projection("EPSG:4326");
        var point = new OpenLayers.LonLat(lon, lat).transform(proj, map.getProjectionObject());
        var feature = geodjango_geometry.read_wkt("POINT (" + point.lon + " " + point.lat + ")");
        geodjango_geometry.deleteFeatures();
        geodjango_geometry.write_wkt(feature);
        geodjango_geometry.layers.vector.addFeatures([feature]);
        map.setCenter(point, 15);
        $results.html('');
    };

    var panBbox = function($results, ymin, ymax, xmin, xmax) {
        // for Bounds, left, bottom, right, top
        var map = geodjango_geometry.map;
        var bounds = new OpenLayers.Bounds(
            parseFloat(xmin), parseFloat(ymin),
            parseFloat(xmax), parseFloat(ymax)
        );
        var proj = new OpenLayers.Projection("EPSG:4326");
        map.zoomToExtent(bounds.transform(proj, map.getProjectionObject()));
    };

    var doSearch = function() {
        var text = $('#id_geometry_admin_map_search').val().trim();
        if(text.length === 0) {
            $results.html('');
            return;
        }

        $results.html('Querying...');

        var lonLatMatch = text.match(/^([0-9.-]+)\s*(,|\s+)\s*([0-9.-]+)$/);
        var dmsMatch = text.match(
            /^([0-9.]+[^0-9.]+)([0-9.]+[^0-9.]+)?([0-9.]+[^0-9.]+)?([NESWnesw])[^0-9.]+([0-9.]+[^0-9.]+)([0-9.]+[^0-9.]+)?([0-9.]+[^0-9.]+)?([NESWnesw])$/
        );
        var lon,lat;
        if(lonLatMatch) {
            lon = parseFloat(lonLatMatch[1]);
            lat = parseFloat(lonLatMatch[3]);
            panAndSet($results, lon, lat);
        } else if(dmsMatch) {
            var latlon1_parts = [
                parseFloat(dmsMatch[1] || "0".replace(/[°d]$/, "")),
                parseFloat((dmsMatch[2] || "0").replace(/['m]$/, "")),
                parseFloat((dmsMatch[3] || "0").replace(/["s]$/, ""))
            ];
            var latlon1_hemisphere = dmsMatch[4].toUpperCase();
            var latlon1 = latlon1_parts[0] + latlon1_parts[1] / 60.0 + latlon1_parts[2] / 3600.0;
            if(latlon1_hemisphere === "S" || latlon1_hemisphere === "W") {
                latlon1 = latlon1 * -1;
            }

            var latlon2_parts = [
                parseFloat(dmsMatch[5] || "0".replace(/[°d]$/, "")),
                parseFloat((dmsMatch[6] || "0").replace(/['m]$/, "")),
                parseFloat((dmsMatch[7] || "0").replace(/["s]$/, ""))
            ];
            var latlon2_hemisphere = dmsMatch[8].toUpperCase();
            var latlon2 = latlon2_parts[0] + latlon2_parts[1] / 60.0 + latlon2_parts[2] / 3600.0;
            if(latlon2_hemisphere === "S" || latlon2_hemisphere === "W") {
                latlon2 = latlon2 * -1;
            }

            if(latlon1_hemisphere === "E" || latlon1_hemisphere === "W") {
                if(latlon2_hemisphere === "E" || latlon2_hemisphere === "W") {
                    $results.html('<span class="error">Two longitudes provided!</span>');
                    return;
                }

                lon = latlon1;
                lat = latlon2;
            } else {
                if(latlon2_hemisphere === "N" || latlon2_hemisphere === "S") {
                    $results.html('<span class="error">Two latitudes provided!</span>');
                    return;
                }

                lon = latlon2;
                lat = latlon1;
            }

            panAndSet($results, lon, lat);
        } else {
            // geocode
            $results.html('Geocoding "' + text + '"...');
            var requestId = Date.now();
            window.geocodeRequest = requestId;

            $.ajax({
                url: "https://api.pickpoint.io/v1/forward/?key=yxsN6E8EYYHFF_xsa_uL&q=" +
                    encodeURIComponent(text),
                success: function (result) {
                    if(requestId !== window.geocodeRequest) {
                        return;
                    }

                    $results.html('');
                    if(result.length === 0) {
                        $results.html('<span class="error">No results for "' + text + '"</span>');
                    } else {

                        for(var i=0; i<result.length; i++) {
                            var box = result[i].boundingbox;
                            $results.append(
                                '<p data-geocode-box="' + box.join(',') + '"><a href="#">' +
                                result[i].display_name +
                                '</a></p>'
                            );
                            // always pan to first result
                            if(i === 0) {
                                panBbox($results, box[0], box[1], box[2], box[3]);
                            }
                        }

                    }
                },
                error: function() {
                    console.log("AJAX error");
                    $results.html('<span class="error">Error geocoding</span>');
                }
            })
        }

    };

    $('#id_geometry_admin_map_search').on('keypress', function(e) {
        if(e.which === 13) {
            e.preventDefault();
            doSearch();
        }
    });
    $('#id_geometry_admin_map_search_go').on('click', function(e) {
        e.preventDefault();
        doSearch();
    });

    $results.on("click", "p", function(e) {
            var joined_box = $(this).attr('data-geocode-box');
            if(joined_box.length > 0) {
                e.preventDefault();
                var bbox = joined_box.split(',');
                panBbox($results, bbox[0], bbox[1], bbox[2], bbox[3]);
            }
        });
        
    // register actions listeners
    $('#id_geometry_delete').on("click", function(e) {
      e.preventDefault();
      geodjango_geometry.clearFeatures();
    });
    
    $('#id_geometry_finished').on("click", function(e) {
      e.preventDefault();
      Shiny.setInputValue('save_result', true);
      Shiny.setInputValue('quit', true);
    });
    
    $('#id_geometry_cancel').on("click", function(e) {
      e.preventDefault();
      Shiny.setInputValue('quit', true);
    });
    
    geodjango_geometry.layers.vector = new OpenLayers.Layer.Vector(" geometry");
    geodjango_geometry.map.addLayer(geodjango_geometry.layers.vector);
    // Read WKT from the text field.
    var wkt = document.getElementById('id_geometry').value;
    if (wkt){
        // After reading into geometry, immediately write back to
        // WKT <textarea> as EWKT (so that SRID is included).
        var admin_geom = geodjango_geometry.read_wkt(wkt);
        geodjango_geometry.write_wkt(admin_geom);
        if (geodjango_geometry.is_collection){
            // If geometry collection, add each component individually so they may be
            // edited individually.
            for (var i = 0; i < geodjango_geometry.num_geom; i++){
                geodjango_geometry.layers.vector.addFeatures([new OpenLayers.Feature.Vector(admin_geom.geometry.components[i].clone())]);
            }
        } else {
            geodjango_geometry.layers.vector.addFeatures([admin_geom]);
        }
        // Zooming to the bounds.
        geodjango_geometry.map.zoomToExtent(admin_geom.geometry.getBounds());
        if (geodjango_geometry.is_point){
            geodjango_geometry.map.zoomTo(15);
        }
    } else {
        
        geodjango_geometry.map.setCenter(new OpenLayers.LonLat(-4000000, 6000000), 2);
        
    }
    // This allows editing of the geographic fields -- the modified WKT is
    // written back to the content field (as EWKT, so that the ORM will know
    // to transform back to original SRID).
    geodjango_geometry.layers.vector.events.on({"featuremodified" : geodjango_geometry.modify_wkt});
    geodjango_geometry.layers.vector.events.on({"featureadded" : geodjango_geometry.add_wkt});
    
    // Map controls:
    // Add geometry specific panel of toolbar controls
    geodjango_geometry.getControls(geodjango_geometry.layers.vector);
    geodjango_geometry.panel.addControls(geodjango_geometry.controls);
    geodjango_geometry.map.addControl(geodjango_geometry.panel);
    geodjango_geometry.addSelectControl();
    // Then add optional visual controls
    
    geodjango_geometry.map.addControl(new OpenLayers.Control.Scale());
    geodjango_geometry.map.addControl(new OpenLayers.Control.LayerSwitcher());
    // Then add optional behavior controls
    
    
    if (wkt){
        if (geodjango_geometry.modifiable){
            geodjango_geometry.enableEditing();
        }
    } else {
        geodjango_geometry.enableDrawing();
    }
};

// call init on page load
$(function() { 
  geodjango_geometry.init(); 
});
