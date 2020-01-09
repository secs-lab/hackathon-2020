setwd(dirname(rstudioapi::getSourceEditorContext()$path))

ele.dat <- read.csv("data/processed/ele_data.csv")

gee.cov <- read.csv("data/processed/gee_covariates.csv", header = TRUE)


all.dat <- merge(ele.dat, gee.cov, by = c("sitecode", "year"), 
                 all.x = TRUE, all.y = FALSE)


write.table(all.dat, "data/processed/all_data.csv", 
            sep=",", row.names = FALSE)
