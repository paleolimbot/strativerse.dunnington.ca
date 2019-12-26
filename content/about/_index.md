---
title: About
---

The Strativerse isn't anything, yet. Right now it's [Dewey Dunnington](https://fishandwhistle.net/)'s collection of sediment core studies for his Ph.D. thesis. It's intended to be a search engine for time-stratigraphic data. Because Dewey's Ph.D. thesis is on trace metals in lake sediments, it's almost all about trace metals in lake sediments. In the meantime, you might be interested in some other great projects like [Neotoma](http://neotomadb.org/) and the [Journal of Paleolimnology](https://link.springer.com/journal/10933).

## Design

The fundemental unit in the Strativerse is the [record](/record). Records are samples (or collections of samples) that form a record of environmental change from a [feature](/feature) (e.g., a lake or glacier). Records list [publications](/publication) that refer to them, and [parameters](/parameter) that were measured on them. Records are loosely based on the [Linked Earth Proxy Archive Ontology](http://linked.earth/ontology/archive/1.0.0/index-en.html). Most records in the Strativerse are lake sediment cores, or clusters of sediment cores that could not be disambiguated from consulting the relevant publications.

## Implementation

The Strativerse is a collection of text files [hosted on GitHub](https://github.com/paleolimbot/strativerse-hugo), compliled into JSON and HTML by [Hugo](https://gohugo.io/), and served by [Netlify](https://www.netlify.com/). The text files that contain Strativerse content are managed by a command-line toolkit written for [R](https://www.r-project.org) and most effectively used in [RStudio](https://rstudio.com/). This architecture was chosen because it:

- Incurs $0 of ongoing fees (provided traffic is below the cutoff for the Netlify free tier)
- Content files are human-readable
- History of who updated which content files when is managed by GitHub
- Highly efficient to maintain (if you are familiar with R and RStudio)
- GitHub issue tracker effectively coordinates contributions from non-maintainers

## Contributing

The Strativerse isn't quite ready for public contributions, but if you're interested in becoming a maintainer, feel free to [open an issue on GitHub](https://github.com/paleolimbot/strativerse-hugo/issues/new)!


