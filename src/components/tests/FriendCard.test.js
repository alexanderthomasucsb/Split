import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FriendCard } from '../FriendCard';

describe('<FriendCard />', () => {
  const mockItem = {
    id: '1',
    displayName: 'John Doe',
    email: 'john.doe@example.com',
  };

  const mockOnRemove = jest.fn();

  it('renders correctly with displayName', () => {
    const { getByText } = render(
      <FriendCard item={mockItem} onRemove={mockOnRemove} />
    );

    // Check avatar, name, and email
    expect(getByText('J')).toBeTruthy(); // Avatar initial
    expect(getByText('John Doe')).toBeTruthy(); // Name
    expect(getByText('john.doe@example.com')).toBeTruthy(); // Email
  });


});
