setwd(dirname(rstudioapi::getSourceEditorContext()$path))

var.name  <- c("duration_dry_spell", "maxDate_dry_spell", 
               "minDate_dry_spell")
file.date <- c("01_05", "06_10", "2011")


for(i in 1:3){
  
  dat  <- read.csv(paste0("data/raw/", var.name[i], file.date[1], ".csv"), header = TRUE)
  dat2 <- read.csv(paste0("data/raw/", var.name[i], file.date[2], ".csv"), header = TRUE)
  dat3 <- read.csv(paste0("data/raw/", var.name[i], file.date[3], ".csv"), header = TRUE)
  
  
  dat.new <- dat[,c(1, 2:6)]
  dat2.new <- dat2[,c(1, 2:6)]
  #dat3.new <- dat3[,c(18, 2:9)]
  
  dat.merge <- merge(dat.new, dat2.new, by = "system.index", all = TRUE)
  dat.merge <- merge(dat.merge, dat3, by = "system.index", all = TRUE)
  
  
  write.table(dat.merge, paste0("data/raw/", var.name[i], ".csv"), 
              sep=",", row.names = FALSE)
  
  rm(dat, dat2, dat3, dat.new, dat2.new, dat.merge)

}