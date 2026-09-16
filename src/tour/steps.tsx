import React from 'react';

import TourUrlLink from './TourUrlLink';

/**
 * The guided tour's steps, in order. `content` is the copy the user reads;
 * `placement` is only ever a hint about where the tooltip sits relative to the
 * element the step points at.
 *
 * The three closing steps talk about the page as a whole rather than any one
 * control, and their target is the whole app shell - spotlighting that is just
 * the entire viewport, so they're centred instead, which drops the spotlight
 * and reads as a card over the dimmed page.
 */
const CENTERED = 'center' as const;

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
    content: 'Click "View List" to see more info about your countries',
  },
  {
    target: '.tour-step-5',
    content: 'Drag countries to change the order',
  },
  {
    target: '.tour-step-6',
    content: 'Click here to see more options',
  },
  {
    target: '.tour-step-7',
    content: 'You can generate a YouTube playlist from your ranking',
  },
  {
    target: '.tour-step-8',
    content: 'Or view a geographical heat map.',
  },
  {
    target: '.tour-step-9',
    content:
      'Create different rankings by category ("song", "staging") and generate a weighted final ranking',
  },
  {
    target: '.tour-step-10',
    content:
      'Click over here to use a sorter to rank your countries according to your pairwise preferences',
  },
  {
    target: '.tour-step-11',
    content: 'Click "Select" to go back to the country picker',
  },
  {
    target: '.tour-step-12',
    content: 'Click the home icon for more info on this project',
  },
  {
    target: '.tour-step-13',
    content: 'Click the cog icon to access advanced controls',
  },
  {
    target: '.tour-step-14',
    content:
      'In "Rankings" you can select a year and click the links to see the official ranking by voting type (tele, jury, total)',
  },
  {
    target: '.tour-step-15',
    content: 'You can select contestants from multiple years by enabling "Advanced Mode"',
  },
  {
    target: '.tour-step-16',
    content:
      'Want to save or share your ranking? Just copy the URL! All of your ranking data is stored there.',
    placement: CENTERED,
  },
  {
    target: '.tour-step-17',
    content: (
      <>
        e.g. your current URL is: <TourUrlLink />
      </>
    ),
    placement: CENTERED,
  },
  {
    target: '.tour-step-18',
    content: 'Enjoy, friends ❤️',
    placement: CENTERED,
  },
].map((step) => ({ ...step, disableBeacon: true }));
