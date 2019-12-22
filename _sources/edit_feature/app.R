#
# This is a Shiny web application. You can run the application by clicking
# the 'Run App' button above.
#
# Find out more about building applications with Shiny here:
#
#    http://shiny.rstudio.com/
#

edit_wkt <- function(FEATURE_WKT = "", FEATURE_NAME = "")  {
    withr::with_package("shiny", {
        `%>%` <- magrittr::`%>%`
        widget_js <- fs::path_abs(here::here("_sources/edit_feature/widget.js"))
        widget_css <- fs::path_abs(here::here("_sources/edit_feature/widget.css"))
        
        if (FEATURE_WKT != "") {
            FEATURE_WKT_PROJ <- FEATURE_WKT %>% 
                stringr::str_trim() %>% 
                stringr::str_replace_all("\n", " ") %>% 
                sf::st_as_sfc(crs = 4326) %>% 
                sf::st_transform(3857) %>% 
                sf::st_as_text(digits = 10)
        } else {
            FEATURE_WKT_PROJ <- ""
        }
        
        # Define UI for application that draws a histogram
        ui <- fluidPage(
            # header javascript for editor
            tags$head(
                tags$title(glue::glue("Editing '{FEATURE_NAME}'")),
                tags$script(
                    type = "text/javascript",
                    src = "https://cdnjs.cloudflare.com/ajax/libs/openlayers/2.13.1/OpenLayers.js"
                ),
                tags$link(
                    rel = "stylesheet", 
                    type = "text/css",
                    href = "https://cdnjs.cloudflare.com/ajax/libs/openlayers/2.13.1/theme/default/style.css"
                ),
                includeCSS(widget_css)
            ),
            
            includeScript(widget_js),
            
            tags$div(
                id = "id_geometry_map",
                class = "olMap",
                
                tags$div(
                    id = "map_head_container",
                    tags$div(
                        id = "id_geometry_actions",
                        tags$button(
                            id = "id_geometry_delete",
                            name = "geometry_delete", 
                            "Delete all features"
                        ),
                        tags$button(
                            id = "id_geometry_finished",
                            name = "geometry_finished", 
                            "Save and Close"
                        ),
                        tags$button(
                            id = "id_geometry_cancel", 
                            name = "geometry_cancel",
                            "Close"
                        )
                    ),
                    tags$div(
                        id = "id_geometry_search_container",
                        tags$input(id = "id_geometry_admin_map_search", type = "text"),
                        tags$button(id = "id_geometry_admin_map_search_go", "Search"),
                        tags$a(id = "id_geometry_admin_map_search_clear", href = "#", "Clear")
                    ),
                    tags$div(id = "id_geometry_admin_map_search_results")
                )
            ),
            tags$div(
                id = "shiny_debug",
                textAreaInput(
                    "id_geometry", "Initial WKT",
                    value = FEATURE_WKT_PROJ
                ),
                checkboxInput("save_result", "Save result?", value = FALSE),
                checkboxInput("quit", "Quit?", value = FALSE),
                htmlOutput("finalWKTDiv"),
                htmlOutput("shouldQuit")
            )
        )
        
        # Define server logic required to draw a histogram
        server <- function(input, output) {
            
            finalWKT <- reactive({
                txt <- if (input$id_geometry != "") {
                    input$id_geometry %>%
                        stringr::str_remove("^SRID=3857;") %>%
                        stringr::str_trim() %>%
                        stringr::str_replace_all("\n", " ") %>%
                        sf::st_as_sfc(crs = 3857) %>%
                        sf::st_transform(4326) %>%
                        sf::st_as_text(digits = 10)
                } else {
                    ""
                }
            })
            
            output$finalWKTDiv <- renderText({
                txt <- finalWKT()
                glue::glue("<h4>finalWKT</h4><div>{txt}<div>")
            })
            
            output$shouldQuit <- renderText({
                txt <- if (identical(input$quit, TRUE)) {
                    if (identical(input$save_result, TRUE)) {
                        wkt <- finalWKT()
                        stopApp(wkt)
                    } else {
                        stopApp(NULL)
                    }
                    
                    TRUE
                } else {
                    FALSE
                }
                
                glue::glue("<h4>shouldQuit</h4><div>{txt}<div>")
            })
        }
        
        # Run the application 
        runApp(shinyApp(ui = ui, server = server))
    })
}
