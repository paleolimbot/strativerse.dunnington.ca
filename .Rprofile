
if (file.exists("~/.Rprofile")) {
  source("~/.Rprofile")
}


require(tidyverse)

# ---- Dev server ----

if (!("server") %in% names(.GlobalEnv)) {
  server <- NULL
}

sv_build <- function() {
  system("hugo --enableGitInfo")
}

sv_browse <- function(path = sv_editing_url() %||% "", timeout = 30000) {
  path <- gsub("/_index\\.md", "", path)
  path <- gsub("(^/)|(/$)", "", path)
  
  sv_serve()
  time <- Sys.time()
  spinner <- cli::make_spinner()
  while(!sv_is_ready()) {
    Sys.sleep(0.1)
    spinner$spin()
    if (unclass(Sys.time() - time) > (timeout / 1000)) {
      spinner$finish()
      message("Timeout")
      return()
    }
  }
  
  browseURL(glue::glue("http://127.0.0.1:1313/{path}"))
}

sv_serve <- function() {
  if (is.null(server)) {
    server <- processx::process$new("hugo", args = "serve", stdout = "|")
    server <<- server
  }
  invisible(server)
}

sv_is_ready <- function() {
  con <- try(httr::GET("http://127.0.0.1:1313"), silent = TRUE)
  if (inherits(con, "try-error")) {
    FALSE
  } else {
    httr::status_code(con) == 200
  }
}

sv_stop <- function(timeout = 1000) {
  if (!is.null(server)) {
    server$interrupt()
    Sys.sleep(timeout / 1000)
    if (!server$is_alive()) server$kill()
    server <<- NULL
  }
}

sv_server_status <- function() {
  if (is.null(server)) {
    cat("<not started>\n")
  } else {
    cat(server$read_output())
  }
}

# ---- editor ----

sv_editing_url <- function() {
  if (rstudioapi::isAvailable()) {
    ctxt <- rstudioapi::getSourceEditorContext()
    if (!is.null(ctxt) && !is.null(ctxt$path)) {
      raw_path <- fs::path_expand(fs::path_norm(ctxt$path))
      raw_path <- gsub(paste0(getwd(), "/content"), "", raw_path, fixed = TRUE)
      
      if (endsWith(raw_path, "/_index.md")) {
        return(gsub("/_index\\.md$", "", raw_path))
      }
    }
  }
  
  NULL
}

url_to_path <- function(url_path) {
  url_path %>%
    str_remove("http://127\\.0\\.0\\.1:1313") %>%
    str_replace_all("/+", "/") %>% 
    str_remove_all("(^/)|(/$)") %>% 
    file.path(getwd(), "content", ., "_index.md")
}

sv_edit <- function(url_path = clipr::read_clip()) {
  if (rstudioapi::isAvailable()) {
    fname <- url_to_path(url_path)
    
    if (file.exists(fname)) {
      usethis::edit_file(fname)
      invisible(fname)
    } else {
      rlang::abort(glue::glue("No such file: '{fname}'"))
    }
  } else {
    rlang::abort("rstudioapi not available")
  }
}

edit_person <- function(slug = clipr::read_clip()) {
  sv_edit(glue::glue("person/{slug}"))
}

edit_feature <- function(slug = clipr::read_clip()) {
  sv_edit(glue::glue("feature/{slug}"))
}

edit_publication <- function(slug = clipr::read_clip()) {
  sv_edit(glue::glue("publication/{slug}"))
}

edit_parameter <- function(slug = clipr::read_clip()) {
  sv_edit(glue::glue("parameter/{slug}"))
}

edit_record <- function(slug = clipr::read_clip()) {
  sv_edit(glue::glue("record/{slug}"))
}

open_feature <- function(url = clipr::read_clip()) {
  if (!str_detect(url, "record")) {
    abort("Must be a record URL")
  }
  
  fname <- url_to_path(url)
  if (!file.exists(fname)) {
    abort(glue::glue("No such file: '{fname}'"))
  }
  
  info <- yaml::read_yaml(fname)
  if (is.null(info$feature)) {
    abort("No feature to edit")
  }
  
  edit_feature(info$feature)
  
  invisible(info$feature)
}

open_people <- function(url = clipr::read_clip()) {
  if (!str_detect(url, "publication")) {
    abort("Must be a publication URL")
  }
  
  pub_file <- url_to_path(url)
  if (!file.exists(pub_file)) {
    abort(glue::glue("No such file: '{pub_file}'"))
  }
  
  pub_info <- yaml::read_yaml(pub_file)
  for (person in pub_info$people) {
    edit_person(person)
  }
  
  invisible(pub_info$people)
}
