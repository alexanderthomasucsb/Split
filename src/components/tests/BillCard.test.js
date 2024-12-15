import React from 'react';
import renderer from 'react-test-renderer';
import BillCard from '../BillCard';

describe('<BillCard />', () => {
  const mockItem = {
    id: '1',
    billTitle: 'Lunch',
    billDescription: 'Lunch with friends',
    amount: 25.0,
    category: 'food',
    isCreator: false,
    status: 'pending',
    creatorName: 'John Doe',
    createdAt: new Date(),
  };


  it('contains all expected children', () => {
    const tree = renderer.create(
      <BillCard
        item={mockItem}
        currentUser="testUser"
        onPress={() => {}}
        onPaymentPress={() => {}}
      />
    ).toJSON();
    expect(tree.children).toBeDefined(); // Ensure it has children
    expect(tree.children.length).toBeGreaterThan(0); // Adjust this as necessary
  });
});
