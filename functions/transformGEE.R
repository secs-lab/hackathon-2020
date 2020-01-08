require(reshape2)

mergeGEE <- function(df, col.name){
  
  #select sitecode column and relevant data columns from GEE
  #if data is up to 2017 
  if(ncol(df) == 30){
    
    df2 <- df[, c(27, 2:18)]
    
  #if data is up to 2019
  } else if (ncol(df) == 32){
    
    df2 <- df[, c(29, 2:20)]
    
  }
    
  df3 <- melt(df2, id.vars = "sitecode")
    
  names(df3)[2] <- "year"
  names(df3)[3] <- col.name
  
  
  df3$year <- substr(df3$year, 2, 5)
  
  #names(dat3)[3] <- substr(as.character(dat3[1,2]), 7, nchar(as.character(dat3[1,2])))
  
  
  return(df3)
}
