setwd(dirname(rstudioapi::getSourceEditorContext()$path))

#read in processed elephant and GEE datasets
ele.dat <- read.csv("data/processed/ele_data.csv", header = TRUE)
gee.cov <- read.csv("data/processed/gee_covariates.csv", header = TRUE)

#Combine both datasets into a single dataframe
all.dat <- merge(ele.dat, gee.cov, by = c("sitecode", "year"), 
                 all.x = TRUE, all.y = FALSE)

#export combined dataframe as a csv
write.table(all.dat, "data/processed/all_data.csv", 
            sep=",", row.names = FALSE)
