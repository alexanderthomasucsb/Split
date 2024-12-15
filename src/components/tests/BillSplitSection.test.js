import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BillSplitSection from '../BillSplitSection';

describe('<BillSplitSection />', () => {
  const mockCurrentUser = {
    email: 'currentuser@example.com',
  };

  const mockFriends = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ];

  const mockSelectedFriends = ['1', '2'];

  const mockFriendSplits = {
    '1': { value: 50 },
    '2': { value: 50 },
  };

  const mockStyles = {
    selectedFriendsContainer: { padding: 10 },
    splitControls: { flexDirection: 'row' },
    splitModeButton: { margin: 5 },
    splitModeButtonActive: { backgroundColor: 'blue' },
    splitModeButtonText: { color: 'black' },
    splitModeButtonTextActive: { color: 'white' },
    splitTypeToggle: { marginTop: 10 },
    selectedFriendItem: { marginVertical: 5 },
    currentUserSplit: { fontWeight: 'bold' },
    selectedFriendInfo: { flexDirection: 'row' },
    selectedFriendName: { fontSize: 16 },
    splitInput: { borderColor: 'gray', borderWidth: 1 },
    splitAmount: { fontSize: 14 },
    removeButton: { padding: 5 },
  };

  const mockScrollViewRef = { current: { scrollTo: jest.fn() } };
  const mockFriendPositions = { current: {} };

  const calculateCurrentUserSplit = jest.fn(() => 50);
  const calculateSplitAmount = jest.fn((friendId) => mockFriendSplits[friendId]?.value || 0);
  const onRemoveFriend = jest.fn();
  const onUpdateSplitAmount = jest.fn();
  const onToggleSplitMode = jest.fn();
  const onToggleSplitType = jest.fn();

  it('renders correctly when there are selected friends', () => {
    const { getByText } = render(
      <BillSplitSection
        currentUser={mockCurrentUser}
        selectedFriends={mockSelectedFriends}
        friends={mockFriends}
        splitMode="equal"
        splitType="amounts"
        friendSplits={mockFriendSplits}
        onRemoveFriend={onRemoveFriend}
        onUpdateSplitAmount={onUpdateSplitAmount}
        onToggleSplitMode={onToggleSplitMode}
        onToggleSplitType={onToggleSplitType}
        calculateCurrentUserSplit={calculateCurrentUserSplit}
        calculateSplitAmount={calculateSplitAmount}
        styles={mockStyles}
        scrollViewRef={mockScrollViewRef}
        friendPositions={mockFriendPositions}
      />
    );

    // Check if the current user is displayed
    expect(getByText('You')).toBeTruthy();
    expect(getByText('currentuser@example.com')).toBeTruthy();

    // Check if friends are displayed
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('calls onToggleSplitMode when split mode buttons are pressed', () => {
    const { getByText } = render(
      <BillSplitSection
        currentUser={mockCurrentUser}
        selectedFriends={mockSelectedFriends}
        friends={mockFriends}
        splitMode="equal"
        splitType="amounts"
        friendSplits={mockFriendSplits}
        onRemoveFriend={onRemoveFriend}
        onUpdateSplitAmount={onUpdateSplitAmount}
        onToggleSplitMode={onToggleSplitMode}
        onToggleSplitType={onToggleSplitType}
        calculateCurrentUserSplit={calculateCurrentUserSplit}
        calculateSplitAmount={calculateSplitAmount}
        styles={mockStyles}
        scrollViewRef={mockScrollViewRef}
        friendPositions={mockFriendPositions}
      />
    );

    const equalButton = getByText('Split Equally');
    const customButton = getByText('Custom Split');

    fireEvent.press(equalButton);
    fireEvent.press(customButton);

    expect(onToggleSplitMode).toHaveBeenCalledTimes(2);
  });
});
