import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';
import { db } from './Firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

vi.mock('./firebaseConfig', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
}));

vi.mock('./Star', () => ({
  __esModule: true,
  default: ({ filled, hovered, onClick, onMouseEnter, onMouseLeave }) => (
    <span
      data-testid="star"
      className={`star ${filled ? 'filled' : ''} ${hovered ? 'hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      ★
    </span>
  ),
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders search bar', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Search for a track...')).toBeInTheDocument();
  });

  test('searches for tracks and displays dropdown', async () => {
    const mockTracks = [
      { name: 'Track 1', artist: 'Artist 1', mbid: '1' },
      { name: 'Track 2', artist: 'Artist 2', mbid: '2' },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: { trackmatches: { track: mockTracks } } }),
      })
    );

    render(<App />);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Search for a track...'), { target: { value: 'Track' } });
      fireEvent.click(screen.getByText('Search'));
    });

    await waitFor(() => {
      expect(screen.getByText('Track 1 by Artist 1')).toBeInTheDocument();
      expect(screen.getByText('Track 2 by Artist 2')).toBeInTheDocument();
    });
  });

  test('handles track selection and fetches album cover', async () => {
    const mockTracks = [
      { name: 'Track 1', artist: 'Artist 1', mbid: '1' },
    ];

    global.fetch = vi.fn((url) => {
      if (url.includes('track.search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: { trackmatches: { track: mockTracks } } }),
        });
      } else if (url.includes('track.getInfo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ track: { album: { image: [{}, {}, {}, { '#text': 'cover.jpg' }] } } }),
        });
      }
    });

    render(<App />);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Search for a track...'), { target: { value: 'Track' } });
      fireEvent.click(screen.getByText('Search'));
    });

    await waitFor(() => {
      act(() => {
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Track 1 by Artist 1' } });
      });
    });

    await waitFor(() => {
      expect(screen.getByAltText('Album Cover')).toHaveAttribute('src', 'cover.jpg');
    });
  });

  test('handles rating and comment submission', async () => {
    const mockTracks = [
      { name: 'Track 1', artist: 'Artist 1', mbid: '1' },
    ];

    global.fetch = vi.fn((url) => {
      if (url.includes('track.search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: { trackmatches: { track: mockTracks } } }),
        });
      } else if (url.includes('track.getInfo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ track: { album: { image: [{}, {}, {}, { '#text': 'cover.jpg' }] } } }),
        });
      }
    });

    render(<App />);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Search for a track...'), { target: { value: 'Track' } });
      fireEvent.click(screen.getByText('Search'));
    });

    await waitFor(() => {
      act(() => {
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Track 1 by Artist 1' } });
      });
    });

    await waitFor(() => {
      act(() => {
        fireEvent.click(screen.getAllByTestId('star')[4]);
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("What's up with it? Up to 280 characters."), { target: { value: 'Great track!' } });
      fireEvent.click(screen.getByText('Post'));
    });

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(collection(db, 'ratings'), {
        rating: 5,
        comment: 'Great track!',
        track: 'Track 1',
        artist: 'Artist 1',
        timestamp: expect.any(Date),
      });
    });
  });

  test('displays error message on fetch failure', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch tracks from Last.fm')));

    render(<App />);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Search for a track...'), { target: { value: 'Track' } });
      fireEvent.click(screen.getByText('Search'));
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch tracks. Please try again later.')).toBeInTheDocument();
    });
  });

  test('displays error message on album cover fetch failure', async () => {
    const mockTracks = [
      { name: 'Track 1', artist: 'Artist 1', mbid: '1' },
    ];

    global.fetch = vi.fn((url) => {
      if (url.includes('track.search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: { trackmatches: { track: mockTracks } } }),
        });
      } else if (url.includes('track.getInfo')) {
        return Promise.reject(new Error('Failed to fetch album cover from Last.fm'));
      }
    });

    render(<App />);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Search for a track...'), { target: { value: 'Track' } });
      fireEvent.click(screen.getByText('Search'));
    });

    await waitFor(() => {
      act(() => {
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Track 1 by Artist 1' } });
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch album cover. Please try again later.')).toBeInTheDocument();
    });
  });

  test('disables post button while loading', async () => {
    const mockTracks = [
      { name: 'Track 1', artist: 'Artist 1', mbid: '1' },
    ];

    global.fetch = vi.fn((url) => {
      if (url.includes('track.search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: { trackmatches: { track: mockTracks } } }),
        });
      } else if (url.includes('track.getInfo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ track: { album: { image: [{}, {}, {}, { '#text': 'cover.jpg' }] } } }),
        });
      }
    });

    render(<App />);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Search for a track...'), { target: { value: 'Track' } });
      fireEvent.click(screen.getByText('Search'));
    });

    await waitFor(() => {
      act(() => {
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Track 1 by Artist 1' } });
      });
    });

    await waitFor(() => {
      act(() => {
        fireEvent.click(screen.getAllByTestId('star')[4]);
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("What's up with it? Up to 280 characters."), { target: { value: 'Great track!' } });
      fireEvent.click(screen.getByText('Post'));
    });

    await waitFor(() => {
      expect(screen.getByText('Posted!')).toBeInTheDocument();
    });
  });
});