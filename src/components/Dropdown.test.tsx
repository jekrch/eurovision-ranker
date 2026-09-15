// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';

import Dropdown from './Dropdown';

/** The panel animates in on the next frame. */
const settle = async () => {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
};

const OPTIONS = ['Sweden', 'Norway', 'Denmark'];

async function openMenu(props: Partial<React.ComponentProps<typeof Dropdown>> = {}) {
  const onChange = vi.fn();
  render(<Dropdown value="Sweden" onChange={onChange} options={OPTIONS} {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Sweden' }));
  await settle();
  return { onChange };
}

const optionNames = () =>
  screen
    .getAllByRole('menuitem')
    .map((item) => item.textContent?.trim())
    .filter(Boolean);

describe('a closed dropdown', () => {
  it('shows the current choice', () => {
    render(<Dropdown value="Sweden" onChange={vi.fn()} options={OPTIONS} />);

    expect(screen.getByRole('button', { name: 'Sweden' })).toBeTruthy();
  });

  it('keeps its options out of the way', () => {
    render(<Dropdown value="Sweden" onChange={vi.fn()} options={OPTIONS} />);

    expect(screen.queryByRole('menuitem')).toBeNull();
  });
});

describe('an open dropdown', () => {
  it('offers every option', async () => {
    await openMenu();

    expect(optionNames()).toEqual(OPTIONS);
  });

  it('reports the option that was chosen', async () => {
    const { onChange } = await openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Norway' }));

    expect(onChange).toHaveBeenCalledWith('Norway');
  });

  it('offers nothing to choose when there are no options', async () => {
    render(<Dropdown value="" onChange={vi.fn()} options={[]} />);
    fireEvent.click(screen.getByRole('button'));
    await settle();

    expect(screen.getByText('No matches')).toBeTruthy();
  });
});

describe('a dropdown that can be searched', () => {
  it('narrows the options to what was typed', async () => {
    await openMenu({ showSearch: true });

    fireEvent.change(screen.getByLabelText('Search options'), { target: { value: 'den' } });

    expect(optionNames()).toEqual(['Sweden', 'Denmark']);
  });

  it('ignores the case of what was typed', async () => {
    await openMenu({ showSearch: true });

    fireEvent.change(screen.getByLabelText('Search options'), { target: { value: 'NOR' } });

    expect(optionNames()).toEqual(['Norway']);
  });

  it('says so when nothing matches', async () => {
    await openMenu({ showSearch: true });

    fireEvent.change(screen.getByLabelText('Search options'), { target: { value: 'zzz' } });

    expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
    expect(screen.getByText('No matches')).toBeTruthy();
  });

  it('starts from the full list the next time it is opened', async () => {
    await openMenu({ showSearch: true });
    fireEvent.change(screen.getByLabelText('Search options'), { target: { value: 'den' } });

    fireEvent.click(screen.getByRole('menuitem', { name: 'Denmark' }));
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Sweden' }));
    await settle();

    expect(optionNames()).toEqual(OPTIONS);
  });
});

describe('a dropdown wired to the value it sets', () => {
  it('shows the newly chosen option', async () => {
    function Example() {
      const [value, setValue] = useState('Sweden');
      return <Dropdown value={value} onChange={setValue} options={OPTIONS} />;
    }
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Sweden' }));
    await settle();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Norway' }));
    await settle();

    expect(screen.getByRole('button', { name: 'Norway' })).toBeTruthy();
  });
});
