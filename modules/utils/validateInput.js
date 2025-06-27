export function validateGenres(userGenres, availableGenres) {
  const availableSet = new Set(availableGenres.map(g => g.toLowerCase()));
  return userGenres.filter(g => availableSet.has(g.toLowerCase()));
}
