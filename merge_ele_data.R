library(reshape2)

setwd(dirname(rstudioapi::getSourceEditorContext()$path))

#read in caluclated elephant poaching and population datasets
load("data/raw/SH_AnnualModelPreds.Rdata")
ele_sums <- readRDS("data/raw/ele_sums.Rdata")

#read in raw populaion survery data, select relevant columns
#and filter to relevant years
pop.dat <- read.csv("data/raw/Copy of all_popn_estimates_mikesites_140401.csv", header = TRUE)
pop.dat <- pop.dat[-154,] # remove duplicate survey in same year
pop.dat <- pop.dat[pop.dat$year > 2001, c("sitecode", "year", "area", "est", "var", "dens")]

#read in poaching survey data, select relevant columns
#and filter to relevant years
pike.stats <- read.csv("data/raw/Copy of 170810_PikeStatsUpTo2016.csv", header = TRUE)
pike.stats <- pike.stats[pike.stats$year > 2001, c("siteid", "year", "totcarc", "illegal")]
names(pike.stats)[1] <- "sitecode"

#'convert arrays to data frames
ele.dat  <- as.data.frame.table(site_quants.pike.full)
ele.sums <- as.data.frame.table(ele_sums)

#expand quantile values to individual columns
ele.dat.wide  <- dcast(ele.dat, Var2 + Var3 ~ Var1, value.var="Freq")
ele.sums.wide <- dcast(ele.sums, Var2 + Var3 ~ Var1, value.var="Freq")

#rename columns
names(ele.dat.wide) <- c("sitecode", "year", "poach_q5", "poach_q50", "poach_q95")
names(ele.sums.wide) <- c("sitecode", "year", "pop_q5", "pop_q50", "pop_q95")

#create list of datafraes to be merged
df.list <- list(ele.dat.wide, ele.sums.wide, pop.dat,  
                pike.stats)

#merge all dataframes in the list in turn, keeping only records with matches
#in the poaching rate dataset
ele.all <- Reduce(function(x, y) 
            merge(x, y, by = c("sitecode", "year"),
                 all.x = TRUE, all.y = FALSE), 
            df.list, accumulate = FALSE)

#export combined dataframe as a csv
write.table(ele.all, "data/processed/ele_data.csv", 
            sep=",", row.names = FALSE)
