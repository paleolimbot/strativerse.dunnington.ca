
$(function() {
  var divId = 'strat-map-main';
  var $div = $('#' + divId);
  if($div.length === 0) {
    // no map
    return;
  }

  var opts = $.extend(
    {
      initialExtent: {minLon: -180, minLat: -80, maxLon: 180, maxLat: 80},
      types: ["feature"]
    },
    strat_map_options
  );

  var map = L.map(divId);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  if(opts.initialExtent) {
    var latLonBounds = new L.LatLngBounds(
      [opts.initialExtent.minLat, opts.initialExtent.minLon],
      [opts.initialExtent.maxLat, opts.initialExtent.maxLon]
    );
    map.fitBounds(latLonBounds);
  }

  $.getJSON(search_config.indexURI, function (search_index) {
    for (var i=0; i<search_index.length; i++) {
      var item = search_index[i];
      if ((opts.types.includes(item.type)) && item.geometry.latitude) {
        var marker = L.marker([item.geometry.latitude, item.geometry.longitude]).addTo(map);
        marker.bindPopup(
          '<div class="map-popup"><h4><a href="' + item.relpermalink + '" target="_blank">' + item.title + '</a></h4><p>[' + item.type + '] ' + item.blurb + '</p></div>'
        );
      }
    }
  });
});
