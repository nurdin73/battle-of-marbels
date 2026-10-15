import { describe, it, expect } from 'bun:test';

function parseRoute(pathname: string) {
  const roomMatch = pathname.match(/^\/rooms\/([a-zA-Z0-9_-]+)/);
  if (roomMatch && roomMatch[1]) {
    return { name: 'ROOM', roomCode: roomMatch[1].toUpperCase() };
  }
  return { name: 'SOLO' };
}

describe('Router logic for PvP and Solo routes', () => {
  it('parses root "/" as SOLO route', () => {
    const route = parseRoute('/');
    expect(route.name).toBe('SOLO');
  });

  it('parses arbitrary subpath without /rooms as SOLO route', () => {
    const route = parseRoute('/about');
    expect(route.name).toBe('SOLO');
  });

  it('parses "/rooms/KL82C4" as ROOM route with upper-cased roomCode', () => {
    const route = parseRoute('/rooms/KL82C4');
    expect(route.name).toBe('ROOM');
    if (route.name === 'ROOM') {
      expect(route.roomCode).toBe('KL82C4');
    }
  });

  it('handles lowercase room code in url and normalizes to uppercase', () => {
    const route = parseRoute('/rooms/kl99x1');
    expect(route.name).toBe('ROOM');
    if (route.name === 'ROOM') {
      expect(route.roomCode).toBe('KL99X1');
    }
  });
});
