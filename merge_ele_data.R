library(reshape2)

setwd(dirname(rstudioapi::getSourceEditorContext()$path))

load("data/raw/SH_AnnualModelPreds.Rdata")
ele_sums <- readRDS("data/raw/ele_sums.Rdata")

pop.dat <- read.csv("data/raw/Copy of all_popn_estimates_mikesites_140401.csv", header = TRUE)
pop.dat <- pop.dat[pop.dat$year > 2001, c("sitecode", "year", "area", "est", "var", "dens")]

pike.stats <- read.csv("data/raw/Copy of 170810_PikeStatsUpTo2016.csv", header = TRUE)
pike.stats <- pike.stats[pike.stats$year > 2001, c("siteid", "year", "totcarc", "illegal")]
names(pike.stats)[1] <- "sitecode"


ele.dat  <- as.data.frame.table(site_quants.pike.full)
ele.sums <- as.data.frame.table(ele_sums)

ele.dat.wide  <- dcast(ele.dat, Var2 + Var3 ~ Var1, value.var="Freq")
ele.sums.wide <- dcast(ele.sums, Var2 + Var3 ~ Var1, value.var="Freq")


names(ele.dat.wide) <- c("sitecode", "year", "poach_q5", "poach_q50", "poach_q95")
names(ele.sums.wide) <- c("sitecode", "year", "pop_q5", "pop_q50", "pop_q95")

df.list <- list(ele.dat.wide, ele.sums.wide, pop.dat,  
                pike.stats)

ele.all2 <- Reduce(function(x, y) 
            merge(x, y, by = c("sitecode", "year"),
                 all.x = TRUE, all.y = FALSE), 
            df.list, accumulate = FALSE)

write.table(ele.all, "data/processed/ele_data.csv", 
            sep=",", row.names = FALSE)
