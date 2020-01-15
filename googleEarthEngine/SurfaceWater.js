var bounds = ee.FeatureCollection("users/colinbeale/ElesOnFire/boundaries"),
    africa = ee.FeatureCollection("users/colinbeale/ElesOnFire/Africa");
	
var bounds = bounds.filterBounds(africa);

// load monthly surface water collection and clip to africa:
var water_IC = ee.ImageCollection("JRC/GSW1_1/MonthlyHistory")
//               .map(function(im) {return (im.clip(africa))});
print('Surf Water', water_IC);

Map.addLayer(water_IC.first, {}, 'First Water');
Map.addLayer(bounds, {}, 'bounds');

