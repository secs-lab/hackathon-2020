library(reshape2)

setwd(dirname(rstudioapi::getSourceEditorContext()$path))

load("data/raw/SH_AnnualModelPreds.Rdata")

pop.dat <- read.csv("data/raw/Copy of all_popn_estimates_mikesites_140401.csv", header = TRUE)
pop.dat <- pop.dat[pop.dat$year > 2001, c("sitecode", "year", "area", "est", "var", "dens")]

pike.stats <- read.csv("data/raw/Copy of 170810_PikeStatsUpTo2016.csv", header = TRUE)
pike.stats <- pike.stats[pike.stats$year > 2001, c("siteid", "year", "totcarc", "illegal")]
names(pike.stats)[1] <- "sitecode"


ele.dat <- as.data.frame.table(site_quants.pike.full)

ele.dat.wide <- dcast(ele.dat, Var2 + Var3 ~ Var1, value.var="Freq")

names(ele.dat.wide) <- c("sitecode", "year", "q5", "q50", "q95")

ele.all <- merge(ele.dat.wide, pop.dat, by = c("sitecode", "year"), 
                 all.x = TRUE, all.y = FALSE)
ele.all <- merge(ele.all, pike.stats, by = c("sitecode", "year"), 
                 all.x = TRUE, all.y = FALSE)


write.table(ele.all, "data/processed/ele_data.csv", 
            sep=",", row.names = FALSE)
