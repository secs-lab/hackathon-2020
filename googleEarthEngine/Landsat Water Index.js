var bounds = ee.FeatureCollection("users/colinbeale/ElesOnFire/boundaries"),
    africa = ee.FeatureCollection("users/colinbeale/ElesOnFire/Africa");
	
// NDWI from https://www.sciencedirect.com/science/article/pii/S0034425715302753#t0005

var bounds = bounds.filterBounds(africa);

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

var j = 0;
var nsites = bounds.size()

var siteIds = ee.List(['KER', 
'AKG',
'SCH',
'WAZ',
'CHR',
'SHW',
'GMS',
'KLU',
'KUI',
'SKP',
'BGS',
'GAR',
'OKP',
'SLW',
'NYA',
'ZIA',
'KRU',
'DZA',
'MCH',
'SEL',
'MAR',
'NDK',
'LOP',
'MRU',
'SGB',
'DEO',
'EDO',
'TAI',
'GRO',
'RHR',
'KHB',
'VIR',
'KTV',
'ETO',
'CHE',
'CAP',
'GOU',
'WPT',
'MKB',
'ODZ',
'SAL',
'XBN',
'NIA',
'MAG',
'ALW',
'SAP',
'COM',
'GSH',
'YKR',
'BBS',
'WAY',
'KAK',
'QEZ',
'WBJ',
'CTN',
'CDM',
'EGU',
'NKK',
'MKR',
'DHG',
'SVK',
'SUK',
'MOL',
'FAZ',
'BBK',
'CHO',
'SBR',
'KER',
'NAZ',
'WBF',
'WNE',
'TSV',
'MKZ',
'TGR',
'ZAK',
'EGK',
'NAK',
'BBL',
'KSG',
'KSH',
'BBR',
'PDJ',
'WYD',
'MYS',
'NIL',
'MBJ',
'CHU',
'NPH',
'ALE']);

// Loop to calculate PA's seperately 


var i = 0
while(i < siteIds.length()){
  var geom = bounds.filterMetadata('sitecode','equals', siteIds.get(j));
print(geom, j);
print(i);
 
  j = j + 1;
  
  }

//print(siteIds.length());
//var i; 
//for (var i = 0; i < siteIds.length(); i++) {
//var geom = bounds.filterMetadata('sitecode','equals', siteIds.get(j));
//print(geom, j);
//print(i);
//Map.addLayer(geom)
//j=j+1;
//}
//print(j)
/*
// load and compile LS data:
var L7coll1 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')  // no scan line error
               .filterDate('2000-01-01', '2002-12-31')
               .filter(ee.Filter.lt('CLOUD_COVER',35))
               .filterBounds(bounds.filterMetadata('system:id', 'equals', j))
               .map(cloudMaskL457);
print(L7coll1, "l7")
var L7coll2 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')  // scan line error present
               .filterDate('2003-01-01', '2013-12-31')
               .filter(ee.Filter.lt('CLOUD_COVER',35))
               .filterBounds(bounds)
               .map(cloudMaskL457)
               .map(fixL7);
var L7coll = ee.ImageCollection(L7coll1.merge(L7coll2));
var L8coll = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
               .filter(ee.Filter.lt('CLOUD_COVER',35))
               .filterBounds(bounds)
               .map(cloudMaskL8)
               .map(renameLS8);
var LS_merge = ee.ImageCollection(L7coll.merge(L8coll));
var LS_merge = LS_merge.map(function(image){
//    var im = image.set('system:time_start', ee.Date(image.get('system:time_start')));
    return im.select(
      ['B1','B2','B3','B4','B5','B7'],
      ['blue','green','red','nir','swir1','swir2']
      );
    })
    .sort('system:time_start');

print ("Landsat_merge", LS_merge);

//List years
var years = ee.List.sequence(2001, 2018);
///List months
var months = ee.List.sequence(1, 12);

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
print( "Monthly averages by year", byMonthYear);


// Function to calculate the Water Index
// 1.7204 + 171*b2 + 3*b3 - 70*b4 - 45*b5 - 71*b7

function addWI2015(input) {
  var wi2015 = (input.select('B2').multiply(171))
  .add(input.select('B3').multiply(3))
  .subtract(input.select('B4').multiply(70))
  .subtract(input.select('B5').multiply(45))
  .subtract(input.select('B7').multiply(71))
  .add(1.7204)
  
      .rename('WI2015');
return input.addBands(wi2015);
  
}

var byMonthYear = byMonthYear.map(addWI2015)

print('wi2015', byMonthYear);
Map.addLayer(byMonthYear.first().select('WI2015'), {}, 'Water Index');
Map.addLayer(bounds, {}, 'bounds');
*/