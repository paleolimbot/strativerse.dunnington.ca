
pubs <- sv_publications()
recs <- sv_records()

pubs_with_records <- do.call(c, recs$publications) %>% 
  unique()

pubs_skip <- c("williams80", "brugam_carlson81", "johansson85")

pubs %>% 
  filter(!(slug %in% c(pubs_with_records, pubs_skip))) %>% 
  arrange(date) %>% 
  slice(1) %>% 
  pull(slug) %>% 
  paste0("publication/", .) %>% 
  sv_browse()
