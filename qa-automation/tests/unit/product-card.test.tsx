import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProductCard from '../../../src/components/product-card';

// Mock Firebase hooks
vi.mock('@/hooks/use-firestore', () => ({
  useFirestore: vi.fn(() => ({
    data: [],
    loading: false,
    error: null,
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }))
}));

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with required props', async () => {
    const mockProps = {
      product: {
        id: '1',
        name: 'Test Product',
        category: 'grocery',
        quantity: 5,
        expiryDate: new Date('2024-12-31').toISOString(),
        createdAt: new Date().toISOString(),
        userId: 'test-user'
      },
      onEdit: vi.fn(),
      onDelete: vi.fn()
    };
    
    render(<ProductCard {...mockProps} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('displays correct content', async () => {
    const mockProps = {
      product: {
        id: '1',
        name: 'Milk',
        category: 'dairy',
        quantity: 2,
        expiryDate: new Date('2024-01-15').toISOString(),
        createdAt: new Date().toISOString(),
        userId: 'test-user'
      },
      onEdit: vi.fn(),
      onDelete: vi.fn()
    };
    
    render(<ProductCard {...mockProps} />);
    
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/dairy/i)).toBeInTheDocument();
  });

  test('handles click events', async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    
    const mockProps = {
      product: {
        id: '1',
        name: 'Test Product',
        category: 'grocery',
        quantity: 1,
        expiryDate: new Date('2024-12-31').toISOString(),
        createdAt: new Date().toISOString(),
        userId: 'test-user'
      },
      onEdit: mockOnEdit,
      onDelete: mockOnDelete
    };
    
    render(<ProductCard {...mockProps} />);
    
    // Test edit button click
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith(mockProps.product);
    
    // Test delete button click
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith(mockProps.product.id);
  });

  test('shows expiration warning for soon-to-expire products', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const mockProps = {
      product: {
        id: '1',
        name: 'Expiring Product',
        category: 'fresh',
        quantity: 1,
        expiryDate: tomorrow.toISOString(),
        createdAt: new Date().toISOString(),
        userId: 'test-user'
      },
      onEdit: vi.fn(),
      onDelete: vi.fn()
    };
    
    render(<ProductCard {...mockProps} />);
    
    expect(screen.getByText(/expires soon/i)).toBeInTheDocument();
  });

  test('shows expired warning for expired products', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const mockProps = {
      product: {
        id: '1',
        name: 'Expired Product',
        category: 'fresh',
        quantity: 1,
        expiryDate: yesterday.toISOString(),
        createdAt: new Date().toISOString(),
        userId: 'test-user'
      },
      onEdit: vi.fn(),
      onDelete: vi.fn()
    };
    
    render(<ProductCard {...mockProps} />);
    
    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });

  test('handles quantity updates', async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    
    const mockProps = {
      product: {
        id: '1',
        name: 'Test Product',
        category: 'grocery',
        quantity: 5,
        expiryDate: new Date('2024-12-31').toISOString(),
        createdAt: new Date().toISOString(),
        userId: 'test-user'
      },
      onEdit: mockOnEdit,
      onDelete: vi.fn()
    };
    
    render(<ProductCard {...mockProps} />);
    
    // Test quantity increment
    const incrementButton = screen.getByRole('button', { name: /increment/i });
    await user.click(incrementButton);
    
    await waitFor(() => {
      expect(mockOnEdit).toHaveBeenCalledWith({
        ...mockProps.product,
        quantity: 6
      });
    });
  });

  test('applies correct styling based on category', async () => {
    const mockProps = {
      product: {
        id: '1',
        name: 'Fresh Product',
        category: 'fresh',
        quantity: 1,
        expiryDate: new Date('2024-12-31').toISOString(),
        createdAt: new Date().toISOString(),
        userId: 'test-user'
      },
      onEdit: vi.fn(),
      onDelete: vi.fn()
    };
    
    render(<ProductCard {...mockProps} />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveClass('product-card');
    expect(card).toHaveAttribute('data-category', 'fresh');
  });

  test('handles missing optional props gracefully', async () => {
    const mockProps = {
      product: {
        id: '1',
        name: 'Minimal Product',
        category: 'grocery',
        quantity: 1,
        expiryDate: new Date('2024-12-31').toISOString(),
        createdAt: new Date().toISOString(),
        userId: 'test-user'
      }
      // onEdit and onDelete not provided
    };
    
    render(<ProductCard {...mockProps} />);
    
    expect(screen.getByText('Minimal Product')).toBeInTheDocument();
    // Should not crash when buttons are clicked without handlers
  });

  test('displays product image when provided', async () => {
    const mockProps = {
      product: {
        id: '1',
        name: 'Product with Image',
        category: 'grocery',
        quantity: 1,
        expiryDate: new Date('2024-12-31').toISOString(),
        imageUrl: 'https://example.com/product.jpg',
        createdAt: new Date().toISOString(),
        userId: 'test-user'
      },
      onEdit: vi.fn(),
      onDelete: vi.fn()
    };
    
    render(<ProductCard {...mockProps} />);
    
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockProps.product.imageUrl);
    expect(image).toHaveAttribute('alt', mockProps.product.name);
  });
});