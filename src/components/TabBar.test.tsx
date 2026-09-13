// @vitest-environment jsdom
import { faHeart, faHouseUser } from '@fortawesome/free-solid-svg-icons';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, it, expect, beforeAll } from 'vitest';

import TabBar from './TabBar';
import TabButton from './TabButton';

/**
 * jsdom has no layout, so every offset reads as 0. These stubs stand in for it:
 * each tab's content is 20 wide inside a 52 wide button, laid out left to right
 * in DOM order, which is the shape the underline is measured from.
 */
const BUTTON_WIDTH = 52;
const CONTENT_WIDTH = 20;
const BUTTON_HEIGHT = 44;
/** the icon's width plus TabBar's overhang on each side */
const LINE_WIDTH = CONTENT_WIDTH + 16;

beforeAll(() => {
  const tabs = () => Array.from(document.querySelectorAll('[data-tab-active]'));

  const define = (prop: string, read: (el: HTMLElement) => number) =>
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get(this: HTMLElement) {
        return read(this);
      },
    });

  const buttonOf = (el: HTMLElement) => el.closest<HTMLElement>('[data-tab-active]');
  const indexOf = (el: HTMLElement) => {
    const button = buttonOf(el);
    return button ? tabs().indexOf(button) : -1;
  };

  define('offsetWidth', (el) => {
    if (el.hasAttribute('data-tab-active')) return BUTTON_WIDTH;
    if (el.hasAttribute('data-tab-indicator-target')) {
      return Number(el.dataset.testContentWidth ?? CONTENT_WIDTH);
    }
    return 0;
  });
  define('offsetHeight', (el) => (el.hasAttribute('data-tab-active') ? BUTTON_HEIGHT : 0));
  define('offsetTop', () => 0);
  define('offsetLeft', (el) => {
    const index = indexOf(el);
    if (index < 0) return 0;
    const buttonLeft = index * BUTTON_WIDTH;
    if (el.hasAttribute('data-tab-active')) return buttonLeft;
    // content sits centred in its button unless a test places it elsewhere
    const placement = el.dataset.testContentLeft;
    if (placement) return buttonLeft + Number(placement);
    return buttonLeft + (BUTTON_WIDTH - Number(el.dataset.testContentWidth ?? CONTENT_WIDTH)) / 2;
  });
});

const TwoTabBar: React.FC = () => {
  const [tab, setTab] = useState('about');
  return (
    <TabBar activeKey={tab}>
      <TabButton
        isActive={tab === 'about'}
        onClick={() => setTab('about')}
        icon={faHouseUser}
        label="About"
      />
      <TabButton
        isActive={tab === 'donate'}
        onClick={() => setTab('donate')}
        icon={faHeart}
        label="Donate"
      />
    </TabBar>
  );
};

const indicator = () => document.querySelector<HTMLElement>('[data-tab-indicator]');

describe('TabBar', () => {
  const centreOf = (line: HTMLElement) => {
    const [, left] = /translate\((-?\d+)px/.exec(line.style.transform) ?? [];
    return Number(left) + parseFloat(line.style.width) / 2;
  };

  it('underlines the tab that is selected on first render', () => {
    render(<TwoTabBar />);

    const line = indicator()!;
    expect(line.style.width).toBe(`${LINE_WIDTH}px`);
    expect(centreOf(line)).toBe(BUTTON_WIDTH / 2);
  });

  it('moves the underline to the newly selected tab', () => {
    render(<TwoTabBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Donate' }));

    expect(centreOf(indicator()!)).toBe(BUTTON_WIDTH + BUTTON_WIDTH / 2);
  });

  it('centres the underline on the tab icon when the icon is off centre', () => {
    render(<TwoTabBar />);
    const donate = screen.getByRole('button', { name: 'Donate' });
    // the icon hugs the left edge of its tab rather than sitting in the middle
    donate.querySelector<HTMLElement>('[data-tab-indicator-target]')!.dataset.testContentLeft = '0';

    fireEvent.click(donate);

    // centred on the icon, not on the tab it sits in
    expect(centreOf(indicator()!)).toBe(BUTTON_WIDTH + CONTENT_WIDTH / 2);
  });

  it('keeps the underline within the tab when the icon nearly fills it', () => {
    render(<TwoTabBar />);
    const donate = screen.getByRole('button', { name: 'Donate' });
    const content = donate.querySelector<HTMLElement>('[data-tab-indicator-target]')!;
    content.dataset.testContentWidth = String(BUTTON_WIDTH - 4);

    fireEvent.click(donate);

    expect(parseFloat(indicator()!.style.width)).toBe(BUTTON_WIDTH);
  });

  it('appears under the first selection rather than sliding in to it', () => {
    render(<TwoTabBar />);

    expect(indicator()?.className).not.toContain('tab-indicator-animation');
  });

  it('slides when the selection changes', () => {
    render(<TwoTabBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Donate' }));

    expect(indicator()?.className).toContain('tab-indicator-animation');
  });

  it('leaves no underline when no tab is selected', () => {
    render(
      <TabBar activeKey="none">
        <TabButton isActive={false} onClick={() => {}} icon={faHouseUser} label="About" />
      </TabBar>,
    );

    expect(indicator()).toBeNull();
  });
});
