//This script calculates yearly forest cover for each protected area in Africa

var roi = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[33.822059552624296, -2.0625598441005013],
          [33.844032208874296, -2.3150608252476372],
          [34.206581036999296, -2.6004422999469248],
          [34.096717755749296, -3.5987228794273287],
          [34.777870099499296, -3.6096874778669177],
          [34.942665021374296, -3.7083628593227065],
          [35.316200177624296, -3.532932531482112],
          [35.459022443249296, -3.521967017673606],
          [35.986366193249296, -3.23681949196047],
          [36.129188458874296, -2.7760300381831895],
          [35.997352521374296, -2.6443415903014613],
          [35.700721661999296, -2.479711451775135],
          [35.579872052624296, -1.7551137259713454],
          [35.546913068249296, -1.3927022829238496],
          [35.272254865124296, -1.2169666834593715],
          [34.920692365124296, -1.173030929805022],
          [34.624061505749296, -1.3597528063247102],
          [34.580116193249296, -1.7111885182976678],
          [34.063758771374296, -1.8978633911726486]]]),
    bounds = ee.FeatureCollection("users/colinbeale/ElesOnFire/boundaries"),
    africa = ee.FeatureCollection("users/colinbeale/ElesOnFire/Africa");
	
//We only want the PAs in Africa
var bounds = bounds.filterBounds(africa)

//YEARLY COVER OF FOREST
//Load in modis
var modis = ee.ImageCollection('MODIS/006/MCD12Q1')
              .select('LC_Type1')
              .filterDate('2001-01-01','2017-12-31');

//Clip to Africa
var modis = modis.map(function(im){return(im.clip(africa))});                  

//Visualise MODIS land cover map for one year - 2001
var year = 2001
var filtered = modis.filter(ee.Filter.calendarRange(year, year, 'year'))
var image = filtered.first()
var image = image.clip(africa)

var palette =[
  '1f8dff',//water
  '152106',//evergreen needleaf forests
  '225129',//evergreen broadleaf forests
  '369b47',//deciduous needleleaf forests
  '30eb5b',//deciduoud broadleaf forests
  '387242',//mixed deciduous forests
  '6a2325',//closed shrubland
  'c3aa69',//openshrubland
  'b76031',//woody savanna
  'd9903d',//savanna
  '91af40',//grasslands
  '111149',//permanenet wetlands
  'cdb33b', //croplands
  'cc0013', //urban
  '33280d', //crop/natural veg. mosaic
  'd7cdcc',//permanent snow/ice
  'f7e084', //barren/desert
  ].join(',');
Map.addLayer(image,{'min':0,'max':17,'palette':palette});

//Where is forest (MODIS categories 1-5) in that year
var any_forest = ee.Image(image).eq(1).or(image.eq(2)).or(image.eq(3)).or(image.eq(4)).or(image.eq(5))
Map.addLayer(any_forest,{},'any_forest')
print(any_forest,'any_forest')

//Iterate above process over all years - 2001-2017
var years = ee.List.sequence(2001, 2017);
var byYear = ee.ImageCollection.fromImages(
      years.map(function(y) {
        var year = y
        var filtered = modis.filter(ee.Filter.calendarRange(year, year, 'year'))
        var image = filtered.first()
        var image2 = image.clip(africa)
        var any_forest = ee.Image(image2).eq(1).or(image2.eq(2)).or(image2.eq(3)).or(image2.eq(4)).or(image2.eq(5))
        return any_forest.set('year',y)
}).flatten());
print(byYear)

//Convert the IC to a multiband image, making sure to name each band according to the year
var numbers = ee.List.sequence(0, byYear.size().subtract(1));
var oldnames = numbers.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_LC_Type1'))});
var newnames = years.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_forest_pn'))});
print(oldnames);
print(newnames);

var mb_byYear_2 = byYear.toBands().select(
  oldnames,
  newnames);
print(mb_byYear_2, 'mb_byYear_2')

Export.image.toAsset({
  image: mb_byYear_2,
  description: 'mb_byYear_2',
  assetId: 'mb_byYear_2',
  region: africa,
  scale: 500,
  maxPixels: 1e10
})

//STATISTICS WITHIN PROTECTED AREAS
//Plot protected areas
Map.addLayer(bounds, {color: 'yellow', fillColor: '000000'}, 'bounds');
print(bounds,'bounds')

//What is the yearly forest cover proportion inside each polygon?
var c = mb_byYear_2.reduceRegions({
  reducer: ee.Reducer.mean(),
  collection: bounds,
  scale:1000
  });
print(c);

// Export the FeatureCollection.
Export.table.toDrive({collection: c,description: 'yearly_forest_pn'});

