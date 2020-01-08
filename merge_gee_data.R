
setwd(dirname(rstudioapi::getSourceEditorContext()$path))

source("functions/transformGEE.r")

burn.prop.wide <- read.csv("data/raw/burn_prop.csv", header = TRUE)
burn.freq.wide <- read.csv("data/raw/burn_freq.csv", header = TRUE)
prec.ann.wide  <- read.csv("data/raw/Total_annual_rainfall.csv", header = TRUE)

burn.prop.long <- transformGEE(burn.prop.wide, "burn_prop")
burn.freq.long <- transformGEE(burn.freq.wide, "burn_freq")
prec.ann.long  <- transformGEE(prec.ann.wide, "annual_prec")

df.list <- list(burn.prop.long, burn.freq.long, prec.ann.long)
comb.dat <- Reduce(function(x, y) 
                   merge(x, y, by = c("sitecode", "year"), all = TRUE), 
                   df.list, accumulate = FALSE)

