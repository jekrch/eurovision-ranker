export const tourSteps = [
    {
      target: '.tour-step-1',
      content: 'Select the year that you want to rank countries from',
    },
    {
      target: '.tour-step-2',
      content: 'Drag countries you want to rank from the left to the right column',
    },
    {
      target: '.tour-step-3',
      content: 'Use the bottom nav controls to edit your list',
    },
    {
      target: '.tour-step-4',
      content: 'Click "Details" to see more info about your countries',
    },
    {
      target: '.tour-step-5',
      content: 'Drag countries around to change the order',
    },
    {
      target: '.tour-step-6',
      content: 'Click the TV icon to generate a youtube playlist from your ranking',
    },
    {
      target: '.tour-step-7',
      content: 'Click the globe icon to see a heat map of your ranking',
    },
    {
      target: '.tour-step-8',
      content: 'Click "Details" to go back to the country picker',
    },
    {
      target: '.tour-step-9',
      content: 'Click the home icon for more info on this project',
    },
    {
      target: '.tour-step-10',
      content: 'Click the cog icon to access advanced controls',
    },
    {
      target: '.tour-step-11',
      content: 'In "Rankings" you can select a year and click the links to see the official ranking by vote type from that year',
    },
    {
      target: '.tour-step-12',
      content: 'Want to save or share your ranking? Just copy the URL! All of your ranking data is stored there.',
    },
    {
      target: '.tour-step-13',
      content: 'e.g. your current URL has the ranking in it: eurovision-ranker.com?n=Sigrit%27s+Top+Picks&y=23&r=nidk4t',
    },
    {
      target: '.tour-step-14',
      content: 'Enjoy, friends ❤️',
    }
  ].map(step => ({ ...step, disableBeacon: true }));