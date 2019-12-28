
if (file.exists("~/.Rprofile")) {
  source("~/.Rprofile")
}


require(tidyverse)
source("_sources/edit_feature/app.R")

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
  prelim_path <- if_else(
    str_ends(url_path, "_index.md"),
    url_path,
    url_path %>%
      str_remove("(http://)?127\\.0\\.0\\.1:1313") %>%
      file.path("content", ., "_index.md")
  )
  
  prelim_path %>%
    fs::path_real() %>% 
    fs::path_rel(getwd())
}

sv_edit <- function(x) {
  UseMethod("sv_edit")
}

sv_edit.default <- function(x) {
  if (!missing(x)) {
    abort(
      glue::glue(
        "Don't know how to edit object of type {paste('`', class(x), '`', collapse = '/')}"
      )
    )
  }
  
  x <- clipr::read_clip()
  
  if (is.null(x)) {
    abort("Nothing on the clipboard.")
  }
  
  sv_edit(clipr::read_clip())
}

sv_edit.tbl_df <- function(x) {
  if (nrow(x) > 10) {
    rlang::abort("Can't edit more than 10 files at a time")
  }
  
  walk(x$file, sv_edit)
}

sv_edit.character <- function(x) {
  if (rstudioapi::isAvailable()) {
    fname <- url_to_path(x)
    
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
    rlang::abort("Must be a record URL")
  }
  
  fname <- url_to_path(url)
  if (!file.exists(fname)) {
    rlang::abort(glue::glue("No such file: '{fname}'"))
  }
  
  info <- yaml::read_yaml(fname)
  if (is.null(info$feature)) {
    rlang::abort("No feature to edit")
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
    rlang::abort(glue::glue("No such file: '{pub_file}'"))
  }
  
  pub_info <- yaml::read_yaml(pub_file)
  for (person in pub_info$people) {
    edit_person(person)
  }
  
  invisible(pub_info$people)
}

# ---- Object readers ----

read_list <- function(fname = clipr::read_clip(), pb = NULL) {
  if (!is.null(pb)) pb$tick()$print()
  
  fname <- url_to_path(fname)
  if (!file.exists(fname)) {
    rlang::abort(glue::glue("No such file: '{fname}'"))
  }
  
  content_type <- str_match(fname, "content/([a-z]+)/")[, 2, drop = TRUE]
  slug <- str_match(fname, "content/[a-z]+/([A-Za-z0-9/_-]+)/_index\\.md")[, 2, drop = TRUE]
  if (is.na(content_type)) {
    content_type <- "page"
  }
  
  lst <- yaml::read_yaml(fname)
  if (!is.list(lst))  {
    lst <- list()
  }
  
  lst <- c(list(content_type = content_type, slug = slug, file = as.character(fname)), lst)
  
  if ("publications" %in% names(lst)) {
    lst$publications <- as.list(lst$publications)
  }
  
  if ("parameters" %in% names(lst)) {
    lst$parameters <- as.list(lst$parameters)
  }
  
  if ("people" %in% names(lst)) {
    lst$people <- as.list(lst$people)
  }
  
  lst
}

read_df <- function(fname = clipr::read_clip(), pb = NULL) {
  lst <- read_list(fname, pb = pb)
  
  list_col_fields <- c("csl", "people", "parameters", "publications", "bbox")
  is_list_col <- names(lst) %in% list_col_fields
  lst[is_list_col] <- map(lst[is_list_col], list)
  if (!all(map_int(lst, length) == 1)) {
    fname_real <- url_to_path(fname)
    rlang::abort(glue::glue("One or more fields in '{fname_real}' has length != 1"))
  }
  
  as_tibble(lst)
}

content_files <- function(content_type) {
  files <- list.files(
    file.path("content", content_type),
    pattern = "_index\\.md$", 
    recursive = TRUE,
    full.names = TRUE
  )
  # filter out the base _index.md for each content type
  files[basename(dirname(files)) != content_type]
}

read_content_list <- function(content_type, pb = progress_estimated) {
  files <- content_files(content_type)
  
  pb <- pb(length(files))
  
  lst <- map(files, read_list, pb = pb)
  names(lst) <- map_chr(lst, "slug")
  lst
}

read_content_df <- function(content_type, pb = progress_estimated) {
  files <- content_files(content_type)
  
  pb <- pb(length(files))
  
  lst <- map(files, read_df, pb = pb)
  as_tibble(rlang::exec(plyr::rbind.fill, !!!lst))
}

sv_people <- function() {
  read_content_df("person")
}

sv_features <- function() {
  read_content_df("feature") %>% 
    mutate_at(vars(longitude, latitude, slug, geo_error), ~as.numeric(na_if(.x, "")))
}

sv_publications <- function() {
  read_content_df("publication") %>% 
    mutate_at(vars(contains("date")), as.Date)
}

sv_parameters <- function() {
  read_content_df("parameter")
}

sv_records <- function() {
  read_content_df("record") %>% 
    mutate_at(vars(contains("date")), as.Date) %>% 
    mutate_at(vars(longitude, latitude, slug, geo_error), ~as.numeric(na_if(.x, "")))
}

# ---- validators -----

content_exists <- function(content_type, slug) {
  file.exists(url_to_path(file.path(content_type, slug)))
}

# ---- editors ----

sv_slug <- function(x) {
  files <- url_to_path(x)
  str_match(files, "content/([a-z]+)/([A-Za-z0-9/_-]+)/_index\\.md")[, 3, drop = TRUE]
}

sv_content_type <- function(x) {
  files <- url_to_path(x)
  str_match(files, "content/([a-z]+)/([A-Za-z0-9/_-]+)/_index\\.md")[, 2, drop = TRUE]
}

write_content <- function(content) {
  if (is.data.frame(content)) {
    rlang::abort("Can't write data frames as content")
  }
  
  file <- content$file
  if (!file.exists(file)) {
    rlang::abort(glue::glue("No such file: '{file}'"))
  }
  
  content <- content[setdiff(names(content), c("file", "content_type", "slug"))]
  
  yaml_regex <- regex("^(\\s*---\n)(.*?)\n(---)", multiline = TRUE, dotall = TRUE)
  file_contents <- read_file(file)
  current_yaml <- str_extract(file_contents, yaml_regex)
  new_yaml <- yaml::as.yaml(content, indent.mapping.sequence = TRUE)
  
  if (is.na(current_yaml)) {
    new_file_contents <- str_c("---\n", new_yaml, "---\n\n", file_contents)
  } else {
    new_file_contents <- str_replace(file_contents, yaml_regex, str_c("\\1", new_yaml, "\\3"))
  }
  
  write_file(new_file_contents, file)
  invisible(file)
}

modify_content <- function(content, ...) {
  new_values <- rlang::list2(...)
  if (length(new_values) == 0) {
    return(content)
  }
  
  if(!rlang::is_dictionaryish(new_values)) {
    rlang::abort("... must be empty or have unique names")
  }
  
  common_names <- intersect(names(content), names(new_values))
  new_names <- setdiff(names(new_values), names(content))
  content[common_names] <- new_values[common_names]
  content[new_names] <- new_values[new_names]
  content
}

# ---- deleted content ----

sv_delete <- function(path) {
  path <- url_to_path(path)
  if (!file.exists(path)) {
    rlang::abort(glue::glue("There is no file '{path}'"))
  }
  
  unlink(path)
  unlink(dirname(path))
}

# ----  new content ----

create_content <- function(content_type, slug) {
  system(glue::glue("hugo new {content_type}/{slug}"))
  partial_path <- glue::glue("{content_type}/{slug}")
  if (!content_exists(content_type, slug)) {
    rlang::abort(glue::glue("Could not create content {partial_path}"))
  }
  
  url_to_path(partial_path)
}

create_content_int <- function(content_type) {
  files <- content_files(content_type)
  slugs <- sv_slug(files)
  new_slug <- suppressWarnings(max(as.numeric(slugs), na.rm = TRUE)) + 1
  if (is.na(new_slug)) {
    new_slug <- 1
  }
  
  create_content(content_type, new_slug)
}

new_feature <- function(title, feature_type = c("water_body", "glacier", "bog")) {
  if (!is.character(title) || !(length(title) == 1)) {
    rlang::abort("`title` must be a character scalar")
  }
  
  feature_type <- match.arg(feature_type)
  
  new_path <- create_content_int("feature")
  content <- read_list(new_path)
  write_content(modify_content(content, title = title))
  sv_edit(new_path)
  invisible(new_path)
}

new_record <- function(title, feature = sv_editing_url() %||% clipr::read_clip(), 
                       record_type = c("core", "samples", "section", "sensor", "other"), 
                       medium = c("lake_sediment", "glacier_ice", "marine_sediment", "peat", "coral")) {
  if (!is.character(title) || !(length(title) == 1)) {
    rlang::abort("`title` must be a character scalar")
  }
  
  record_type <- match.arg(record_type)
  medium <- match.arg(medium)
  
  if (str_detect(feature, "^[0-9]+$")) {
    feature <- glue::glue("feature/{feature}")
  }
  
  feature_path <- url_to_path(feature)
  if (!file.exists(feature_path) || (sv_content_type(feature_path) != "feature")) {
    rlang::abort(glue::glue("No such  feature: '{feature}'"))
  }
  
  feature_slug <- sv_slug(feature_path)
  
  new_path <- create_content_int("record")
  content <- read_list(new_path)
  write_content(
    modify_content(
      content, 
      title = title, 
      record_type = record_type,
      medium = medium,
      feature = feature_slug
    )
  )
  
  sv_edit(new_path)
}

new_person <- function(given, family, edit = TRUE) {
  if (!is.character(given) || !(length(given) == 1)) {
    rlang::abort("`given` must be a character scalar")
  }
  
  if (!is.character(family) || !(length(family) == 1)) {
    rlang::abort("`family` must be a character scalar")
  }
  
  new_path <- create_content_int("person")
  content <- read_list(new_path)
  write_content(
    modify_content(
      content, 
      given = given,
      family = family, 
      title = paste(given, family)
    )
  )
  
  if (edit) {
    sv_edit(new_path)
  }
  
  invisible(new_path)
}

new_parameter <- function(slug) {
  if (!is.character(slug) || !(length(slug) == 1)) {
    rlang::abort("`slug` must be a character scalar")
  }
  
  new_path <- create_content("parameter", slug)
  sv_edit(new_path)
  invisible(new_path)
}

new_publication <- function(csl, person_index = sv_people()) {
  if (!all(c("id", "title", "author", "issued") %in% names(csl))) {
    rlang::abort("Missing csl components")
  }
  
  person_index_hash <- person_index %>% 
    transmute(
      slug = slug,
      initials_hash = given %>% 
        stringi::stri_trans_general("latin-ascii") %>% 
        str_remove_all("[^A-Z .-]") %>% 
        str_replace_all("\\.", " ") %>% 
        str_replace_all("\\s+", " ") %>% 
        str_trim() %>% 
        str_to_lower(),
      family_hash = family %>% 
        stringi::stri_trans_general("latin-ascii") %>% 
        str_to_lower()
    )
  
  author_df <- tibble(
    order = seq_along(csl$author),
    family = map_chr(csl$author, ~.x$family %||% ""),
    given = map_chr(csl$author, ~.x$given %||% "")
  ) %>% 
    mutate(
      order,
      initials_hash = given %>% 
        stringi::stri_trans_general("latin-ascii") %>% 
        str_remove_all("[^A-Z .-]") %>% 
        str_replace_all("\\.", " ") %>% 
        str_replace_all("\\s+", " ") %>% 
        str_trim() %>% 
        str_to_lower(),
      family_hash = family %>% 
        stringi::stri_trans_general("latin-ascii") %>% 
        str_to_lower()
    ) %>% 
    left_join(person_index_hash, by = c("family_hash", "initials_hash")) %>% 
    group_by(order) %>% 
    slice(1) %>% 
    ungroup() %>% 
    mutate(
      slug_possibly_new = pmap_chr(list(family, given, slug), function(family, given, slug) {
        if (is.na(slug)) {
          new_path <- new_person(given, family, edit = FALSE)
          sv_slug(new_path)
        } else {
          slug
        }
      })
    )
  
  issued <- csl$issued$`date-parts`[[1]]
  date_year <- issued[[1]]
  date_month <- if (length(issued) >= 2) issued[[2]] else 1
  date_day <- if (length(issued) >= 3) issued[[3]] else 1
  date <- lubridate::make_date(date_year, date_month, date_day)
  if (is.na(date)) {
    rlang::abort(glue::glue("No such date: {date_year}-{date_month}-{date_day}"))
  }
  
  slug <- csl$id
  csl$id <- NULL
  
  new_path <- create_content("publication", slug)
  content <- read_list(new_path)
  write_content(
    modify_content(
      content, 
      people = as.list(author_df$slug_possibly_new),
      date = as.character(date),
      csl = csl
    )
  )
  
  sv_edit(new_path)
  invisible(new_path)
}

import_publications <- function(csl_json = rbbt::bbt_bib_zotero("csljson", rbbt::bbt_return)) {
  csl <- jsonlite::fromJSON(csl_json, simplifyVector = FALSE)
  
  ids <- map_chr(csl, "id")
  id_exists <- file.exists(url_to_path(glue::glue("publication/{ids}")))
  
  existing_titles <- map_chr(read_content_list("publication"), c("csl", "title"))
  new_titles <- map_chr(csl, "title")
  id_exists <- id_exists | (new_titles %in% existing_titles)
  
  if (any(id_exists)) {
    message(
      glue::glue(
        "
        Ignoring {sum(id_exists)} previously existing publication(s): 
        {paste0('`', ids[id_exists] , '`', collapse = '')}
        "
      )
    )
    
    csl <- csl[!id_exists]
  }
  
  if (length(csl) == 0) {
    rlang::abort("Zero publications to add")
  }
  
  person_index <- sv_people()
  
  invisible(map_chr(csl, new_publication, person_index = person_index))
}

# ---- editors ----

edit_geometry <- function(path = sv_editing_url() %||% clipr::read_clip()) {
  f <- read_list(path)
  result <- edit_wkt(f$geometry, f$title)
  if (!is.null(result)) {
    if (result == "") {
      new_f <- modify_content(
        f, 
        geometry = "", 
        bbox = NULL, 
        latitude = "", 
        longitude = "", 
        geo_error = 0
      )
    } else {
      geo <- sf::st_as_sfc(result)
      geo_center <- suppressWarnings(sf::st_coordinates(sf::st_centroid(geo)))
      bbox <- sf::st_bbox(geo)
      new_f <- modify_content(
        f, 
        geometry = result, 
        bbox = as.list(bbox), 
        longitude = geo_center[1],
        latitude = geo_center[2]
      )
    }
    
    write_content(new_f)
  } else {
    invisible(NULL)
  }
}

# -------- fix object masking ---------

filter <- function(...) {
  dplyr::filter(...)
}
