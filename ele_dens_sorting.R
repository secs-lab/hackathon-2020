setwd(dirname(rstudioapi::getSourceEditorContext()$path))

#load("data/raw/SH_AnnualModelPreds.Rdata")
#load("data/raw/pike_f1_only.Rdata")
#load("data/raw/pike.f1_jags.Rdata")
load("data/raw/DumpForChris.rdata")

ele_pops <- read.csv("data/raw/Copy of all_popn_estimates_mikesites_140401.csv")

t <- which(ele_pops$var==0)
ele_pops$var[t] <- (ele_pops$est[t]*0.05)^2

# set the Variance of guesses so that the SE is 100% of estimate
w <- which(is.na(ele_pops$var))
ele_pops$var[w] <- (ele_pops$est[w])^2

ele_pops$est[ele_pops$sitecode == "SAL"] <- 1186  #fudge for SAL as estimates dodgy
ele_pops$var[ele_pops$sitecode == "SAL"] <- 124609

ele_arr <- array(NA, dim = c(NROW(site.data), NROW(1989:2017), 2), dimnames = 
                   list(site.data$site, as.character(1989:2017), c("mean", "sd")))

for (i in 1:NROW(ele_pops)){
  if (as.character(ele_pops[i, "sitecode"]) %in% levels (site.data$site)) {
    ele_arr[as.character(ele_pops[i,"sitecode"]),as.character(ele_pops[i,"year"]),1] <- ele_pops[i,"est"]
    ele_arr[as.character(ele_pops[i,"sitecode"]),as.character(ele_pops[i,"year"]),2] <- sqrt(ele_pops[i,"var"])
  }
}

N.func <- function(N0, Nt, t, exclude.high = TRUE) {
  r <- exp(log(Nt/N0)/t)
  if(exclude.high) r[r>1.1] <- 1.1
  r
}

gen.pops <- function(ts = ele_arr[i,,1], sds = ele_arr[i,,2]){
  counts <- ts[!is.na(ts)]
  counts[counts<1] <- 1 # fixes any zero pops
  when_counted <- as.numeric(names(counts))
  nCounts <- NROW(when_counted)
  rs <- rep(1, NROW(ts))
  names(rs) <- names(ts)
  ns <- rs
  ns[!is.na(ts)] <- round(rnorm(nCounts, counts, sds[!is.na(ts)]))
  ns[!is.na(ts) & ns < 1] <- 1
  if(nCounts>1) {
    for(j in nCounts:2) {
      yrs <- (when_counted[j]) - (when_counted[j-1])
      rs[as.character((when_counted[(j-1)]):(when_counted[(j)]))] <- N.func(counts[as.character(when_counted[(j-1)])],
                                                                            counts[as.character(when_counted[j])],
                                                                            yrs)
      for(k in 1:yrs){
        #        Bt <- rpois(1, 0.06 * ns[as.character(when_counted[(j-1)] + k - 1)])
        #        Dt <- rpois(1, Bt / rs[as.character(when_counted[(j-1)] + k - 1)])
        ns[as.character(when_counted[(j-1)] + k)] <- rpois(1, ns[as.character(when_counted[(j-1)] + k - 1)] * rs[as.character(when_counted[(j-1)] + k - 1)])
        #        ns[as.character(when_counted[(j-1)] + k)] <- ns[as.character(when_counted[(j-1)] + k - 1)] +
        #          Bt - Dt
      } # end k
      
    } # end j
    if(when_counted[1]>1989) {
      rs[as.character(1989:when_counted[1])] <- rs[as.character(when_counted[1])]
      yrs <- when_counted[1] - 1989
      
      for(k in 1:yrs){
        #        Bt <- rpois(1, 0.06 * ns[as.character(when_counted[1] - k + 1)])
        #        Dt <- rpois(1, Bt / (1/rs[as.character(when_counted[1] - k + 1)]))
        ns[as.character(when_counted[1] - k)] <- rpois(1, ns[as.character(when_counted[1] - k + 1)]* (1/rs[as.character(when_counted[1] - k + 1)]))
        #        ns[as.character(when_counted[1] - k)] <- ns[as.character(when_counted[(j-1)] - k + 1)] +
        #          Bt - Dt
      } # end k
      
    }
    if(when_counted[nCounts]<2017){
      rs[as.character(when_counted[nCounts]:2017)] <- rs[as.character(when_counted[nCounts])]
      yrs <- 2017-when_counted[nCounts] 
      
      for(k in 1:yrs){
        #        Bt <- rpois(1, 0.06 * ns[as.character(when_counted[nCounts] + k - 1)])
        #        Dt <- rpois(1, Bt / rs[as.character(when_counted[nCounts] + k - 1)])
        ns[as.character(when_counted[nCounts] + k)] <- rpois(1, ns[as.character(when_counted[nCounts] + k - 1)] * rs[as.character(when_counted[nCounts] + k - 1)])
        #        ns[as.character(when_counted[nCounts] + k)] <- ns[as.character(when_counted[nCounts] + k - 1)] +
        #          Bt - Dt
      } # end k
      
    }
  } else {
    yrs <- 2017-when_counted[nCounts] 
    
    for(k in 1:yrs){
      ns[as.character(when_counted[nCounts] + k)] <- rpois(1, ns[as.character(when_counted[nCounts] + k - 1)] * rs[as.character(when_counted[nCounts] + k - 1)])
      #      Bt <- rpois(1, 0.06 * ns[as.character(when_counted[nCounts] + k - 1)])
      #      Dt <- rpois(1, Bt / rs[as.character(when_counted[nCounts] + k - 1)])
      #      ns[as.character(when_counted[nCounts] + k)] <- ns[as.character(when_counted[nCounts] + k - 1)] +
      #        Bt - Dt
    } # end k
    yrs <- when_counted[1] - 1989
    
    for(k in 1:yrs){
      ns[as.character(when_counted[1] - k)] <- rpois(1, ns[as.character(when_counted[1] - k + 1)]* (1/rs[as.character(when_counted[1] - k + 1)]))
      #      Bt <- rpois(1, 0.06 * ns[as.character(when_counted[1] - k + 1)])
      #      Dt <- rpois(1, Bt / (1/rs[as.character(when_counted[1] - k + 1)]))
      #      ns[as.character(when_counted[1] - k)] <- ns[as.character(when_counted[(j-1)] - k + 1)] +
      #        Bt - Dt
    } # end k
    
  }
  ns[ns<0] <- 0
  return(list(ns, rs))
}

gen.pops2 <- function(ts = ele_arr[i,,1]){
  counts <- ts[!is.na(ts)]
  counts[counts<1] <- 1 # fixes any zero pops
  when_counted <- as.numeric(names(counts))
  nCounts <- NROW(when_counted)
  rs <- rep(1, NROW(ts))
  names(rs) <- names(ts)
  ns <- rs
  ns[!is.na(ts)] <- ts[!is.na(ts)]
  ns[!is.na(ts) & ns < 1] <- 1
  
  yrs <- 2017-when_counted[nCounts] 
  if(yrs >0 ){
    for(k in 1:yrs){
      ns[as.character(when_counted[nCounts] + k)] <- counts[nCounts]
    } # end k
  }
  yrs <- when_counted[1] - 1989
  if(yrs>0) {
    for(k in 1:yrs){
      ns[as.character(when_counted[1] - k)] <- counts[1]
    } # end k
  }
  if(nCounts>1) {
    for(j in nCounts:2) {
      yrs <- (when_counted[j]) - (when_counted[j-1])
      rs[as.character((when_counted[(j-1)]):(when_counted[(j)]))] <- N.func(counts[as.character(when_counted[(j-1)])],
                                                                            counts[as.character(when_counted[j])],
                                                                            yrs)
      for(k in 1:yrs){
        ns[as.character(when_counted[(j-1)] + k)] <- round(ns[as.character(when_counted[(j-1)] + k - 1)] * rs[as.character(when_counted[(j-1)] + k - 1)])
      } # end k
      
    } # end j
  } #  end if
  ns
}

site.data2 <- site.data[1:51,]

ele_pops_mc <- array(NA, dim = c(NROW(site.data2), NROW(1989:2017), 1000), dimnames = 
                       list(site.data2$site, as.character(1989:2017), NULL))
ele_pops_constant <- array(NA, dim = c(NROW(site.data2), NROW(1989:2017), 1000), dimnames = 
                             list(site.data2$site, as.character(1989:2017), NULL))

for (i in 1:NROW(site.data2)) {
  for (mc in 1:1000){
    ele_pops_mc[i,,mc] <- gen.pops()[[1]]
  }
  ele_pops_constant[i,,] <- gen.pops2()
  print(paste(i, "complete"))
}

ele_pop_mat <- apply(ele_pops_mc, c(2,3), sum)

ele_sums <- apply(ele_pops_mc, 1:2, quantile, p = c(0.05, 0.5, 0.95), na.rm = T)

saveRDS(ele_sums, file = "data/raw/ele_sums.Rdata")


# boxplot(t(ele_pop_mat[14:29,]), xlab = "year", ylab = "Total Elephant Population")
# 
# i <- 2
# plot(2002:2013, ele_sums[2,i,14:25], type = "l", ylim = range(ele_sums[,i,14:25]), xlab = "year", ylab = "pop", 
#      main = as.character(levels(carc.p$siteid)[i]))
# lines(2002:2013,ele_sums[1,i,14:25], lty = 2)
# lines(2002:2013,ele_sums[3,i,14:25], lty = 2)
# points(2002:2013,ele_arr[i,14:25,1])

