var bounds = ee.FeatureCollection("users/colinbeale/ElesOnFire/boundaries");
var africa = ee.FeatureCollection("users/colinbeale/ElesOnFire/Africa");

//We only want the PAs in Africa
var bounds = bounds.filterBounds(africa)

//Find midpoints of each PA
var mids = bounds.map(function(ft){
  var centroid = ft.geometry().centroid()
  var keepProperties = ['sitecode'] //Keep site code
  return(ee.Feature(centroid).copyProperties(ft, keepProperties))
})
print(mids,'mids')

//Export midpoints as shapefile
Export.table.toDrive({
  collection: mids,
  description: 'PA_centroids',
  fileFormat: 'SHP'
});
