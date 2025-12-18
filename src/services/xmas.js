/**
 * Christmas/Holiday Services
 * Provides static holiday offers and related functionality
 */

/**
 * Get static list of holiday offers
 * @returns {Array} Array of offer objects
 */
function getHolidayOffers() {
  // Static offers - no database persistence needed
  const offers = [
    {
      id: 'offer_1',
      title: 'Holiday Special',
      code: 'XMAS20',
      description: '20% off your next credit simulation report'
    },
    {
      id: 'offer_2',
      title: 'New Year Deal',
      code: 'NEWYEAR25',
      description: '25% off premium features for new customers'
    },
    {
      id: 'offer_3',
      title: 'Season\'s Savings',
      code: 'HOLIDAY15',
      description: '15% off all services throughout December'
    },
    {
      id: 'offer_4',
      title: 'Winter Bonus',
      code: 'WINTER10',
      description: '10% bonus credit on account top-ups'
    },
    {
      id: 'offer_5',
      title: 'Festive Bundle',
      code: 'FESTIVE30',
      description: '30% off annual subscription plans'
    },
    {
      id: 'offer_6',
      title: 'Gift Card Special',
      code: 'GIFT50',
      description: 'Get a $50 gift card with any premium purchase'
    }
  ];
  
  return offers;
}

module.exports = {
  getHolidayOffers
};
