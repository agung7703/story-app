import Map from '../utils/map';

export async function reportMapper(listStory) {
  return {
    ...listStory,
    placeName: await Map.getPlaceNameByCoordinate(listStory.lat, listStory.lon),
  };
}
