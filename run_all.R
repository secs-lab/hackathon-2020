library(reshape2) #used in both 'merge' scripts 

setwd(dirname(rstudioapi::getSourceEditorContext()$path))

source("ele_dens_sorting.R") #calculate elephant population
source("merge_ele_data.R") #combine 4 different elephant data files 
source("merge_gee_data.R") #combine all Google Eath Engine derived covariates
source("combine_ele_gee_data.R") #combine elephant and GEE data