// Catalogue des batiments constructibles, regroupes par categorie
// (memes categories que la reference : Income / Civilian / Produce).

const BUILDING_CATALOG = {
  gold_mine: { id: 'gold_mine', category: 'income', name: 'Mine d\'or', cost: 100, incomePerMin: 50 },
  bank: { id: 'bank', category: 'income', name: 'Banque', cost: 300, incomePerMin: 150 },
  house: { id: 'house', category: 'civilian', name: 'Maison', cost: 50, incomePerMin: 0 },
  market: { id: 'market', category: 'civilian', name: 'Marche', cost: 150, incomePerMin: 10 },
  farm: { id: 'farm', category: 'produce', name: 'Ferme', cost: 120, incomePerMin: 20 },
  factory: { id: 'factory', category: 'produce', name: 'Usine', cost: 200, incomePerMin: 40 },
};

module.exports = { BUILDING_CATALOG };
