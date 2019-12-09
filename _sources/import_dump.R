
library(tidyverse)

pkify <- function(x) {
  as.integer(x)
}

raw <- jsonlite::read_json("_sources/dump-latest.json", simplifyVector = TRUE) %>% 
  mutate(pk = pkify(pk))

people <- raw %>% 
  filter(model == "strativerse.person") %>% 
  transmute(pk, given = fields$given_names, family = fields$last_name) %>% 
  mutate(
    title = paste(given, family) %>% 
      str_replace_all("\\.\\s*", ". ") %>% 
      str_trim(),
    given, 
    ORCID = ""
  ) %>% 
  select(pk, title, given, family, ORCID)

authorships <- raw %>% 
  filter(model ==  "strativerse.authorship") %>% 
  transmute(
    role = fields$role,
    order = fields$order, 
    publication_pk = pkify(fields$publication),
    person_pk = pkify(fields$person)
  ) %>% 
  arrange(publication_pk, role, order) %>% 
  filter(role == "author") %>% 
  group_by(publication_pk) %>% 
  summarise(people = list(as.list(person_pk)))


tag_to_list <- function(x) {
  if (is.na(x)) {
    NULL
  } else {
    jsonlite::fromJSON(str_remove(x, "^application/json:"), simplifyVector = FALSE)
  }
}

publication_tags <- raw %>% 
  filter(
    model == "strativerse.tag", 
    fields$type == "meta",
    map_lgl(fields$content_type, ~any(.x == "publication"))
  ) %>% 
  transmute(
    publication_pk = pkify(fields$object_id),
    key = fields$key,
    value = fields$value
  ) %>% 
  pivot_wider(names_from = key, values_from = value) %>% 
  mutate_at(
    vars(author, issued, accessed, editor),
    ~map(.x, tag_to_list)
  ) %>% 
  rename_at(vars(-publication_pk), ~paste0("csl_", .x))

publications <- raw %>% 
  filter(model == "strativerse.publication") %>% 
  transmute(
    pk,
    slug = fields$slug,
    csl_type = fields$type,
    csl_title = fields$title,
    csl_DOI = fields$DOI,
    csl_URL = fields$URL,
    csl_abstract = fields$abstract
  ) %>% 
  left_join(authorships, by = c("pk" = "publication_pk")) %>% 
  left_join(publication_tags, by = c("pk" = "publication_pk")) %>% 
  select(
    csl_type, csl_title, csl_author, csl_editor, `csl_container-title`, 
    csl_volume, csl_issue, csl_page,
    csl_DOI, csl_URL, 
    csl_abstract,
    everything()
  ) %>% 
  nest(csl = starts_with("csl")) %>% 
  mutate(
    csl = map(
      csl, 
      . %>% 
        select_if(~!identical(.x, list(NULL))) %>% 
        select_if(~!is.na(.x)) %>% 
        select_if(~!identical(.x, "")) %>% 
        rename_all(str_remove, "^csl_")
    ),
    date_year = map_dbl(
      csl, 
      ~as.numeric(.x[["issued"]][[1]][["date-parts"]][[1]][[1]])[1]
    ),
    date_month = map_dbl(
      csl, 
      possibly(~as.numeric(.x[["issued"]][[1]][["date-parts"]][[1]][[2]])[1], NA_real_)
    ) %>% coalesce(1),
    date_day = map_dbl(
      csl, 
      possibly(~as.numeric(.x[["issued"]][[1]][["date-parts"]][[1]][[3]])[1], NA_real_)
    ) %>% coalesce(1),
    date = lubridate::make_date(date_year, date_month, date_day)
  ) %>% 
  transmute(
    slug,
    date = as.character(date),
    people = map(people, as.list),
    old_id = pk,
    csl = map(csl, unclass)
  )

record_pubs <- raw %>% 
  filter(model == "strativerse.recordreference") %>% 
  transmute(
    record_pk = pkify(fields$record),
    publication_pk = pkify(fields$publication)
  ) %>% 
  left_join(publications %>% select(old_id, slug), by = c("publication_pk" = "old_id")) %>% 
  group_by(record_pk) %>% 
  summarise(publications = list(as.list(slug)))

parameters <- raw %>% 
  filter(model == "strativerse.parameter") %>% 
  transmute(
    title = fields$name,
    old_id = pk,
    slug = fields$slug,
    description = fields$description
  )

record_parameters <- raw %>% 
  filter(model == "strativerse.recordparameter") %>% 
  transmute(
    record_pk = pkify(fields$record),
    parameter_pk = pkify(fields$parameter)
  ) %>% 
  left_join(parameters %>% select(old_id, slug), by = c("parameter_pk" = "old_id")) %>% 
  group_by(record_pk) %>% 
  summarise(parameters = list(as.list(slug)))

feature_tags <- raw %>% 
  filter(
    model == "strativerse.tag", 
    fields$type == "meta",
    map_lgl(fields$content_type, ~any(.x == "feature"))
  ) %>% 
  transmute(
    feature_pk = pkify(fields$object_id),
    key = fields$key,
    value = fields$value
  ) %>% 
  pivot_wider(names_from = key, values_from = value) %>% 
  select(feature_pk, OSM = osm_url)

features <- raw %>% 
  filter(model == "strativerse.feature") %>% 
  transmute(
    title = fields$name,
    old_id = pk,
    feature_type = fields$type,
    description = fields$description,
    geometry = fields$geometry %>% str_remove("^SRID=4326;"),
    geo_error = fields$geo_error,
    bbox = map(geometry, possibly(. %>% sf::st_as_sfc() %>% sf::st_bbox() %>% as.list(), NULL)),
    longitude = map_dbl(
      geometry, 
      possibly(. %>% sf::st_as_sfc() %>% sf::st_centroid() %>% sf::st_coordinates() %>% .[, 1, drop = TRUE], NA_real_)
    ),
    latitude = map_dbl(
      geometry, 
      possibly(. %>% sf::st_as_sfc() %>% sf::st_centroid() %>% sf::st_coordinates() %>% .[, 2, drop = TRUE], NA_real_)
    )
  ) %>% 
  left_join(feature_tags, by = c("old_id" = "feature_pk"))

records <- raw %>%
  filter(model == "strativerse.record") %>% 
  transmute(
    title = fields$name,
    old_id = pk,
    date = as.character(fields$date_collected_latest),
    date_collected_latest = as.character(fields$date_collected_latest),
    date_collected_earliest = as.character(fields$date_collected_earliest) %>% 
      replace(., is.na(.), ""),
    record_type = fields$type,
    medium = fields$medium,
    feature = as.character(fields$feature),
    description = fields$description,
    geo_error = fields$geo_error,
    geometry = fields$geometry %>% str_remove("^SRID=4326;") %>% replace(., is.na(.), ""),
    bbox = map(geometry, possibly(. %>% sf::st_as_sfc() %>% sf::st_bbox() %>% as.list(), NULL)),
    longitude = map_dbl(
      geometry, 
      possibly(. %>% sf::st_as_sfc() %>% sf::st_centroid() %>% sf::st_coordinates() %>% .[, 1, drop = TRUE], NA_real_)
    ),
    latitude = map_dbl(
      geometry, 
      possibly(. %>% sf::st_as_sfc() %>% sf::st_centroid() %>% sf::st_coordinates() %>% .[, 2, drop = TRUE], NA_real_)
    )
  ) %>% 
  left_join(record_pubs, by = c("old_id" = "record_pk")) %>% 
  left_join(record_parameters, by = c("old_id" = "record_pk")) %>% 
  select(
    title, old_id, starts_with("date"), record_type, medium, 
    feature, description, parameters, publications, geo_error, 
    geometry, bbox, longitude, latitude
  )

# ---- Write files ----

unlink("content/person", recursive = TRUE)
dir.create("content/person")

for (person in transpose(people)) {
  pk <- person$pk
  person$pk <- NULL
  yaml <- yaml::as.yaml(person, indent.mapping.sequence = TRUE)
  
  dir.create(glue::glue("content/person/{pk}"))
  write_file(glue::glue("---\n{yaml}---\n\n"), glue::glue("content/person/{pk}/_index.md"))
}

unlink("content/publication", recursive = TRUE)
dir.create("content/publication")

for (publication in transpose(publications)) {
  slug <- publication$slug
  publication$slug <- NULL
  
  publication$csl$author <- publication$csl$author[[1]]
  publication$csl$issued <- publication$csl$issued[[1]]
  if (!is.null(publication$csl$accessed)) {
    publication$csl$accessed <- publication$csl$accessed[[1]]
  }
  if (!is.null(publication$csl$editor)) {
    publication$csl$editor <- publication$csl$editor[[1]]
  }
  
  yaml <- yaml::as.yaml(publication, indent.mapping.sequence = TRUE)
  
  dir.create(glue::glue("content/publication/{slug}"))
  write_file(glue::glue("---\n{yaml}---\n\n"), glue::glue("content/publication/{slug}/_index.md"))
}

unlink("content/parameter", recursive = TRUE)
dir.create("content/parameter")

for (parameter in transpose(parameters)) {
  slug <- parameter$slug
  parameter$slug <- NULL
  yaml <- yaml::as.yaml(parameter, indent.mapping.sequence = TRUE)
  
  dir.create(glue::glue("content/parameter/{slug}"), recursive = TRUE)
  write_file(glue::glue("---\n{yaml}---\n\n"), glue::glue("content/parameter/{slug}/_index.md"))
}

unlink("content/feature", recursive = TRUE)
dir.create("content/feature")

for (feature in transpose(features)) {
  old_id <- feature$old_id
  feature$old_id <- NULL
  if (identical(feature$geometry, "")) {
    feature$longitude <- ""
    feature$latitude <- ""
  }
  yaml <- yaml::as.yaml(feature, indent.mapping.sequence = TRUE)
  
  dir.create(glue::glue("content/feature/{old_id}"))
  write_file(glue::glue("---\n{yaml}---\n\n"), glue::glue("content/feature/{old_id}/_index.md"))
}

unlink("content/record", recursive = TRUE)
dir.create("content/record")

for (record in transpose(records)) {
  old_id <- record$old_id
  record$old_id <- NULL
  if (identical(record$geometry, "")) {
    record$longitude <- ""
    record$latitude <- ""
  }
  yaml <- yaml::as.yaml(record, indent.mapping.sequence = TRUE)
  
  dir.create(glue::glue("content/record/{old_id}"))
  write_file(glue::glue("---\n{yaml}---\n\n"), glue::glue("content/record/{old_id}/_index.md"))
}
