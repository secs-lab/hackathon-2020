#library(googledrive)

setwd(dirname(rstudioapi::getSourceEditorContext()$path))

#load function to convert GEE data into suitable format
source("functions/transformGEE.r")

#read in raw GEE datafiles
burn.prop.wide <- read.csv("data/raw/burn_prop.csv", header = TRUE)
burn.int.wide <- read.csv("data/raw/burn_freq.csv", header = TRUE)
burn.cum.wide  <- read.csv("data/raw/cumulative_burn.csv", header = TRUE)
prec.ann.wide  <- read.csv("data/raw/Total_annual_rainfall.csv", header = TRUE)
dur.dry.wide   <- read.csv("data/raw/duration_dry_spell.csv", header = TRUE)
max.dry.wide   <- read.csv("data/raw/maxDate_dry_spell.csv", header = TRUE)
min.dry.wide   <- read.csv("data/raw/minDate_dry_spell.csv", header = TRUE)
drought.wide   <- read.csv("data/raw/Months_of_drought.csv", header = TRUE)
tree.dens.wide <- read.csv("data/raw/yearly_tree_density.csv", header = TRUE)
tree.inc.wide  <- read.csv("data/raw/pn_increasing_tree_density.csv", header = TRUE)
tree.dec.wide  <- read.csv("data/raw/pn_decreasing_tree_density.csv", header = TRUE)

#convert raw datafiles from wide format to long format data shape
burn.prop.long <- transformGEE(burn.prop.wide, "burn_prop")
burn.int.long  <- transformGEE(burn.int.wide, "burn_int")
burn.cum.long  <- transformGEE(burn.cum.wide, "burn_cum")
prec.ann.long  <- transformGEE(prec.ann.wide, "annual_prec")
dur.dry.long   <- transformGEE(dur.dry.wide, "dur_dry")
max.dry.long   <- transformGEE(max.dry.wide, "max_dry")
min.dry.long   <- transformGEE(min.dry.wide, "min_dry")
drought.long   <- transformGEE(drought.wide, "drought")
tree.dens.long <- transformGEE(tree.dens.wide, "tree.dens")
tree.inc.long  <- transformGEE(tree.inc.wide, "inc_tc")
tree.dec.long  <- transformGEE(tree.dec.wide, "dec_tc")

#create list of dataframes to merge into a single dataframe
df.list <- list(burn.prop.long, burn.int.long, burn.cum.long,  
                prec.ann.long, dur.dry.long, max.dry.long, min.dry.long, 
                drought.long, tree.dens.long, tree.inc.long, tree.dec.long)

#merge all dataframes in the list in turn, keeping all records
comb.dat <- Reduce(function(x, y) 
                   merge(x, y, by = c("sitecode", "year"), all = TRUE), 
                   df.list, accumulate = FALSE)

#rm(list=setdiff(ls(), "comb.dat"))

#export combined dataframe as a csv
write.table(comb.dat, "data/processed/gee_covariates.csv", 
            sep=",", row.names = FALSE)  

#upload processed data to Google Drive
#drive_put(paste0(getwd(),"/data/processed/gee_covariates.csv"), 
#          "/ElesOnFire/gee_covariates.csv", type = "csv")
   
