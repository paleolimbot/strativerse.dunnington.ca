
pubs <- sv_publications()
recs <- sv_records()

pubs_with_records <- do.call(c, recs$publications) %>% 
  unique()

pubs_skip <- c("brugam_carlson81", "johansson85", "benoit_etal94")

orphan_pubs <- pubs %>% 
  filter(!(slug %in% c(pubs_with_records, pubs_skip)))


orphan_pubs %>% 
  arrange(date) %>% 
  slice(1) %>% 
  pull(slug) %>% 
  paste0("publication/", .) %>% 
  sv_browse()
