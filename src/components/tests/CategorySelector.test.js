import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategorySelector, { categories } from '../CategorySelector';

describe('<CategorySelector />', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectCategory = jest.fn();

  const defaultProps = {
    showModal: true,
    onClose: mockOnClose,
    selectedCategory: null,
    onSelectCategory: mockOnSelectCategory,
  };

  it('does not render modal when showModal is false', () => {
    const { queryByTestId } = render(
      <CategorySelector {...defaultProps} showModal={false} />
    );

    // Modal should not be visible
    expect(queryByTestId('modal')).toBeNull();
  });

  it('calls onSelectCategory and onClose when a category is selected', () => {
    const { getByText } = render(<CategorySelector {...defaultProps} />);

    const firstCategory = categories[0]; // Select the first category
    const firstCategoryButton = getByText(firstCategory.label);
    fireEvent.press(firstCategoryButton);

    expect(mockOnSelectCategory).toHaveBeenCalledWith(firstCategory.id);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
