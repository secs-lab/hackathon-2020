var bounds = ee.FeatureCollection("users/colinbeale/ElesOnFire/boundaries"),
    africa = ee.FeatureCollection("users/colinbeale/ElesOnFire/Africa"),
    imageVisParam = {"opacity":1,"bands":["constant"],"palette":["183fff","ffffff"]};
	
	
var bounds = bounds.filterBounds(africa);
print(bounds, 'bounds')


// rename LS8 bands to match 5 and 7
var renameLS8 = function(image){
  return image.rename(['B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11']);
};

// fix (as much as possible) landsat 7 scan line error by blurring
var fixL7 = function(image){
//  var filled1a = image.focal_mean(1, 'square', 'pixels', 2);
  var filled1b = image.focal_mean(2, 'square', 'pixels', 4); // RC EDIT
  var keepProps = image.propertyNames();
//  return filled1a.blend(image).toInt16().copyProperties(image, keepProps);
   return filled1b.blend(image).toInt16().copyProperties(image, keepProps); // RC EDIT
};


// mask for landsat 4-7
var cloudMaskL457 = function(image) {
  var qa = image.select('pixel_qa');
  // If the cloud bit (5) is set and the cloud confidence (7) is high
  // or the cloud shadow bit is set (3), then it's a bad pixel.
  var cloud = qa.bitwiseAnd(1 << 5)
          .and(qa.bitwiseAnd(1 << 7))
          .or(qa.bitwiseAnd(1 << 3));
  // Remove edge pixels that don't occur in all bands
  var mask2 = image.mask().reduce(ee.Reducer.min());
  return image.updateMask(cloud.not()).updateMask(mask2);
};

// mask for landsat 8
var cloudMaskL8 = function (image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  // Get the pixel QA band.
  var qa = image.select('pixel_qa');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
};

function addWI2015(input) {
  var wi2015 = (input.select('green').multiply(171))
  .add(input.select('red').multiply(3))
  .subtract(input.select('nir').multiply(70))
  .subtract(input.select('swir1').multiply(45))
  .subtract(input.select('swir2').multiply(71))
  .add(1.7204)
  
      .rename('WI2015');
  return wi2015;
  
}

var years = ee.List.sequence(2001, 2010);
///List months
var months = ee.List.sequence(1, 12);


// get the MODIS scale for reporjectionL
// Load a MODIS EVI image.
var modis = ee.Image(ee.ImageCollection('MODIS/006/MOD13A1').first())
    .select('EVI');


// Get information about the MODIS projection.
var modisProjection = modis.projection();
print('MODIS projection:', modisProjection);


//////////////////////////////////////////////

// THIS IS CODE FOR TESTING MAIN LOOP:
/*

var pa = bounds.first()
print(ee.FeatureCollection(pa), 'pa')
 var L7coll1 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')  // no scan line error
               .filterDate('2000-01-01', '2002-12-31')
               .filter(ee.Filter.lt('CLOUD_COVER',50))
               .filterBounds(pa.geometry())
               .map(cloudMaskL457);
//print(L7coll1, 'L7start')
  var L7coll2 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')  // scan line error present
               .filterDate('2003-01-01', '2013-12-31')
               .filter(ee.Filter.lt('CLOUD_COVER',50))
               .filterBounds(pa.geometry())
               .map(cloudMaskL457)
               .map(fixL7);
  var L7coll = ee.ImageCollection(L7coll1.merge(L7coll2));
  var L8coll = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
               .filter(ee.Filter.lt('CLOUD_COVER',50))
               .filterBounds(pa.geometry())
               .map(cloudMaskL8)
               .map(renameLS8);
  var LS_merge = ee.ImageCollection(L7coll.merge(L8coll));
  LS_merge = LS_merge.map(function(image){
    return image.select(
      ['B1','B2','B3','B4','B5','B7'],
      ['blue','green','red','nir','swir1','swir2']
      ).clip(pa);
    })
    .sort('system:time_start');
//print(LS_merge, 'LS_merge')
    

//Aggregate total over month, then year
//Map.addLayer(byMonth.first(),{}, "Jan Mean");
  var byMonthYear = ee.ImageCollection.fromImages(
      years.map(function(y) {
        return months.map(function (m) {
          return LS_merge.filter(ee.Filter.calendarRange(m, m, 'month'))
                    .filter(ee.Filter.calendarRange(y, y, 'year'))
                    .mean()
                    .set('month', m)
                    .set('year', y);
        });
  }).flatten());
//  print(byMonthYear, 'ByMonthYear');
  
byMonthYear = byMonthYear.map(function(im){
    var band_names = im.bandNames();
    return(im.set('Nbands', band_names.length()));
  });
//  var byMonthYear.filterMetadata

  byMonthYear = byMonthYear
    .filterMetadata('Nbands', 'equals', 6)
    .map(addWI2015);
  
  
    var costs = byMonthYear.map(function(im){
// Define water points from non-water (after threshold calculation)
      var image_water = im.gt(-125000);
      var image_nonwater = im.lte(-125000).unmask(ee.Image.constant(1)).clip(pa);
      var sources = ee.Image().toByte().paint(pa.geometry(), 1).clip(pa);
      sources = sources.updateMask(image_water);
      var maxDist = 10000; // 10km
      // cost image.
      var dist = image_nonwater.cumulativeCost({
          source: sources, 
        maxDistance: maxDist,  
      });
      return(dist);
  });
  var costsMean = costs.map(function(im) {
    // Force the next reprojection to aggregate instead of resampling.
    im.reduceResolution({
      reducer: ee.Reducer.mean(),
      maxPixels: 1024
    })
    // Request the data at the scale and projection of the MODIS image.
    .reproject({
      crs: modisProjection
    });
    return(im);
  });
print(costsMean, 'mean cost 500')
Map.addLayer(costsMean.toBands().select(1), {min:0, max: 10000}, 'costsMean')
Map.addLayer(bounds, {}, 'bounds')

var rand_points = ee.FeatureCollection.randomPoints(pa.geometry(), 5000);

Map.addLayer(rand_points, {}, 'random points')
// flatten to image
var costsImage = costsMean.toBands();

// sample the 500m dataset at the random points:
var cost_sample = costsImage.reduceRegions({
                  collection:rand_points,
                  reducer:ee.Reducer.first(),
                  scale:30,
                  
})
print(cost_sample, 'cost sample')

// compute the means across all points
var cost_means = cost_sample.reduceColumns({
                  reducer: ee.Reducer.mean().repeat(costsImage.bandNames().length()),
                  selectors: ee.List(costsImage.bandNames())})                  
print(cost_means, 'cost means')
   var result = ee.Feature(pa.geometry(), cost_means);
 print(result, 'result')

*/

//////////////////////////////////////////////

// THIS IS CODE THE MAIN LOOP:



var test = bounds.map(function(pa) {


  var L7coll1 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')  // no scan line error
               .filterDate('2000-01-01', '2002-12-31')
               .filter(ee.Filter.lt('CLOUD_COVER',50))
               .filterBounds(pa.geometry())
               .map(cloudMaskL457);
//print(L7coll1, 'L7start')
  var L7coll2 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')  // scan line error present
               .filterDate('2003-01-01', '2013-12-31')
               .filter(ee.Filter.lt('CLOUD_COVER',50))
               .filterBounds(pa.geometry())
               .map(cloudMaskL457)
               .map(fixL7);
  var L7coll = ee.ImageCollection(L7coll1.merge(L7coll2));
  var L8coll = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
               .filter(ee.Filter.lt('CLOUD_COVER',50))
               .filterBounds(pa.geometry())
               .map(cloudMaskL8)
               .map(renameLS8);
  var LS_merge = ee.ImageCollection(L7coll.merge(L8coll));
  LS_merge = LS_merge.map(function(image){
    return image.select(
      ['B1','B2','B3','B4','B5','B7'],
      ['blue','green','red','nir','swir1','swir2']
      ).clip(pa);
    })
    .sort('system:time_start');
//print(LS_merge, 'LS_merge')
    

//Aggregate total over month, then year
//Map.addLayer(byMonth.first(),{}, "Jan Mean");
  var byMonthYear = ee.ImageCollection.fromImages(
      years.map(function(y) {
        return months.map(function (m) {
          return LS_merge.filter(ee.Filter.calendarRange(m, m, 'month'))
                    .filter(ee.Filter.calendarRange(y, y, 'year'))
                    .mean()
                    .set('month', m)
                    .set('year', y);
        });
  }).flatten());
//  print(byMonthYear, 'ByMonthYear');
  
byMonthYear = byMonthYear.map(function(im){
    var band_names = im.bandNames();
    return(im.set('Nbands', band_names.length()));
  });
//  var byMonthYear.filterMetadata

  byMonthYear = byMonthYear
    .filterMetadata('Nbands', 'equals', 6)
    .map(addWI2015);
  
  
    var costs = byMonthYear.map(function(im){
// Define water points from non-water (after threshold calculation)
      var image_water = im.gt(-125000);
      var image_nonwater = im.lte(-125000).unmask(ee.Image.constant(1)).clip(pa);
      var sources = ee.Image().toByte().paint(pa.geometry(), 1).clip(pa);
      sources = sources.updateMask(image_water);
      var maxDist = 10000; // 10km
      // cost image.
      var dist = image_nonwater.cumulativeCost({
          source: sources, 
        maxDistance: maxDist,  
      });
      return(dist);
  });
  var costsMean = costs.map(function(im) {
    // Force the next reprojection to aggregate instead of resampling.
    im.reduceResolution({
      reducer: ee.Reducer.mean(),
      maxPixels: 1024
    })
    // Request the data at the scale and projection of the MODIS image.
    .reproject({
      crs: modisProjection
    });
    return(im);
  });
  
  // flatten to image
  var costsImage = costsMean.toBands();

  var cost_means = costsImage.reduceRegion({
                  geometry:pa.geometry(),
                  reducer:ee.Reducer.mean(),
                  scale:500,
                  tileScale:8,
                  maxPixels:50000000
                  
  });



/*    alternate for random points:
  var rand_points = ee.FeatureCollection.randomPoints(pa.geometry(), 5000);

  // sample the 500m dataset at the random points:
  var cost_sample = costsImage.reduceRegions({
                  collection:rand_points,
                  reducer:ee.Reducer.first(),
                  scale:30,
                  
  });

  // compute the means across all points
  var cost_means = cost_sample.reduceColumns({
                  reducer: ee.Reducer.mean().repeat(costsImage.bandNames().length()),
                  selectors: ee.List(costsImage.bandNames())})                  
*/
  var result = ee.Feature(pa.geometry(), cost_means);

   
   
   return(result);


});

Export.table.toDrive({
  collection: test,
  description: 'waterdist',
  folder:'ElesOnFire',
  fileFormat: 'CSV'
});
//print(test);


/*

print('wi2015', byMonthYear);
Map.addLayer(byMonthYear.first().select('WI2015'), {}, 'Water Index');
Map.addLayer(bounds, {}, 'bounds');
*/