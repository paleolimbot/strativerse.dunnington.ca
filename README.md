
<!-- README.md is generated from README.Rmd. Please edit that file -->

# Strativerse (source)

<!-- badges: start -->

[![Lifecycle:
experimental](https://img.shields.io/badge/lifecycle-experimental-orange.svg)](https://www.tidyverse.org/lifecycle/#experimental)
[![Netlify
Status](https://api.netlify.com/api/v1/badges/935b4c0a-7180-4ad2-ac2a-baf3a8e90cf8/deploy-status)](https://app.netlify.com/sites/gallant-johnson-62b457/deploys)
<!-- badges: end -->

This is the source of the [Strativerse](http://strativerse.org), as a
[Hugo](https://gohugo.io/) site. Changes to this repository are
automatically synced to <https://strativerse.org> using
[Netlify](https://netlify.com). If you are interested in contributing, I
suggest [opening an
issue](https://github.com/paleolimbot/strativerse-hugo/issues/new). You
can browse the Strativerse at <https://strativerse.org/>, or clone this
repository, open in [RStudio](https://rstudio.com/) and use the
hacked-together R toolbox to work with objects in tabular form.

``` r
# these functions are in the .Rprofile and should 
# be loaded when you open the project
sv_records()
#> # A tibble: 1,075 x 18
#>    content_type  slug file  title date       date_collected_…
#>    <chr>        <dbl> <chr> <chr> <date>     <date>          
#>  1 record           1 cont… CORE… 1968-12-31 1968-12-31      
#>  2 record          10 cont… Litt… 1981-12-31 1981-12-31      
#>  3 record         100 cont… Litt… 1998-12-31 1998-12-31      
#>  4 record         101 cont… Lind… 1998-12-31 1998-12-31      
#>  5 record         102 cont… Ste … 1998-12-31 1998-12-31      
#>  6 record         103 cont… Trou… 1998-12-31 1998-12-31      
#>  7 record         104 cont… Winn… 1998-12-31 1998-12-31      
#>  8 record         105 cont… Winn… 1998-12-31 1998-12-31      
#>  9 record         106 cont… Yaya… 1994-12-31 1994-12-31      
#> 10 record         107 cont… Clay… 1995-12-31 1995-12-31      
#> # … with 1,065 more rows, and 12 more variables:
#> #   date_collected_earliest <date>, record_type <chr>, medium <chr>,
#> #   feature <chr>, description <chr>, parameters <list>,
#> #   publications <list>, geo_error <dbl>, geometry <chr>, bbox <list>,
#> #   longitude <dbl>, latitude <dbl>
sv_features()
#> # A tibble: 731 x 13
#>    content_type  slug file  title feature_type description geometry
#>    <chr>        <dbl> <chr> <chr> <chr>        <chr>       <chr>   
#>  1 feature        195 cont… Vits… water_body   Finland     MULTIPO…
#>  2 feature        196 cont… Muna… water_body   Finland     POLYGON…
#>  3 feature        197 cont… Oraj… water_body   Finland     POLYGON…
#>  4 feature        198 cont… Iso-… water_body   Finland     POLYGON…
#>  5 feature        199 cont… Hirv… water_body   Finland     POLYGON…
#>  6 feature        200 cont… Valk… water_body   Finland     POLYGON…
#>  7 feature        201 cont… Vuor… water_body   Finland     POINT (…
#>  8 feature        202 cont… Sonn… water_body   Finland     MULTIPO…
#>  9 feature        203 cont… Iso-… water_body   Finland     MULTIPO…
#> 10 feature        204 cont… Valk… water_body   Finland     POLYGON…
#> # … with 721 more rows, and 6 more variables: geo_error <dbl>,
#> #   bbox <list>, longitude <dbl>, latitude <dbl>, OSM <chr>,
#> #   wikipedia <chr>
sv_publications()
#> # A tibble: 394 x 7
#>    content_type slug      file             date       people csl     old_id
#>    <chr>        <chr>     <chr>            <date>     <list> <list>   <int>
#>  1 publication  al-mur_e… content/publica… 2017-07-01 <list… <named…     NA
#>  2 publication  alexandr… content/publica… 2018-01-01 <list… <named…    290
#>  3 publication  anderson… content/publica… 2005-07-01 <list… <named…    425
#>  4 publication  andren_e… content/publica… 2000-09-01 <list… <named…    427
#>  5 publication  armstron… content/publica… 1973-01-01 <list… <named…     NA
#>  6 publication  arnaud_e… content/publica… 2004-05-10 <list… <named…     NA
#>  7 publication  augustss… content/publica… 2010-12-01 <list… <named…    280
#>  8 publication  azoury_e… content/publica… 2013-07-02 <list… <named…     NA
#>  9 publication  baron_et… content/publica… 1986-07-01 <list… <named…    388
#> 10 publication  baxter_e… content/publica… 1981-05-01 <list… <named…    396
#> # … with 384 more rows
```
