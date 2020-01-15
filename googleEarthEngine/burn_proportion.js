var bounds = ee.FeatureCollection("users/colinbeale/ElesOnFire/boundaries");
var africa = ee.FeatureCollection("users/colinbeale/ElesOnFire/Africa");

var bounds = bounds.filterBounds(africa);
Map.addLayer(bounds, {}, 'bounds');

var dataset = ee.ImageCollection('MODIS/051/MCD45A1')
                  .filterDate('2010-01-01', '2010-12-31');

//Filter to Africa: Map clip function onto each image
var dataset = dataset.map(function(im){
  return(im.clip(africa).mask(im.lt(366)))});                  
print(dataset)

var burnedArea = dataset.select('burndate');

var burnedAreaVis = {
  min: 0,
  max: 1,
  palette: ['00FFFF', '0000FF']
};
Map.setCenter(20, 8, 3);
//Map.addLayer(burnedArea, burnedAreaVis, 'Burned Area');

var composite = burnedArea.max();
Map.addLayer(composite, {min:0, max:366}, 'max value composite');

print(composite);

var results = composite.gt(0).reduceRegions({
  collection: bounds,
  reducer: ee.Reducer.mean(),
  scale:1000
});

print(results);