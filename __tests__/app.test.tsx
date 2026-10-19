import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import App from '../App';

jest.mock('@expo-google-fonts/inter', () => ({
  useFonts: () => [true, null],
  Inter_400Regular: 1,
  Inter_500Medium: 1,
  Inter_600SemiBold: 1,
  Inter_700Bold: 1,
}));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useRealTimers();
});

test('pierwsze uruchomienie: powitanie → nowa myśl → zapis → widoczna na liście', async () => {
  render(<App />);
  fireEvent.press(await screen.findByText('Zaczynamy'));
  expect(await screen.findByText('Zacznij od pierwszej myśli')).toBeTruthy();

  fireEvent.press(screen.getByLabelText('Dodaj myśl'));
  fireEvent.changeText(await screen.findByPlaceholderText('Tytuł myśli'), 'Plan podróży');
  fireEvent.changeText(screen.getByPlaceholderText('Rozwiń swoją myśl…'), 'Japonia w maju');
  fireEvent.press(screen.getByLabelText('Kolor #22D3EE'));
  fireEvent.press(screen.getAllByLabelText('Wróć')[0]);

  expect(await screen.findByText('Plan podróży')).toBeTruthy();
  expect(screen.getByText('Japonia w maju')).toBeTruthy();

  await waitFor(async () => {
    const saved = JSON.parse((await AsyncStorage.getItem('thoughts')) ?? '[]');
    expect(saved[0]).toMatchObject({ title: 'Plan podróży', content: 'Japonia w maju', color: '#22D3EE' });
  });

  fireEvent.changeText(screen.getByPlaceholderText('Szukaj we wszystkich myślach'), 'japonia');
  expect(await screen.findByText('Wyniki: 1')).toBeTruthy();
  fireEvent.changeText(screen.getByPlaceholderText('Szukaj we wszystkich myślach'), 'xyz');
  expect(await screen.findByText('Brak wyników')).toBeTruthy();
});

test('pusta nowa myśl nie zostaje zapisana; usuwanie wymaga potwierdzenia', async () => {
  await AsyncStorage.setItem('thoughts', JSON.stringify([{ id: 'a', title: 'Stara myśl', content: '', color: '#60a5fa' }]));
  const alertSpy = jest.spyOn(Alert, 'alert');
  render(<App />);
  expect(await screen.findByText('Stara myśl')).toBeTruthy();

  fireEvent.press(screen.getByLabelText('Dodaj myśl'));
  await screen.findByPlaceholderText('Tytuł myśli');
  fireEvent.press(screen.getAllByLabelText('Wróć')[0]);
  await waitFor(() => expect(screen.getByText('Twoje myśli · 1')).toBeTruthy());

  fireEvent.press(screen.getByLabelText('Usuń myśl'));
  expect(alertSpy).toHaveBeenCalled();
  const buttons = alertSpy.mock.calls[0][2]!;
  act(() => buttons.find((b) => b.text === 'Usuń')!.onPress!());
  expect(await screen.findByText('Zacznij od pierwszej myśli')).toBeTruthy();
});

test('podmyśli: wejście w myśl i dodanie podmyśli', async () => {
  await AsyncStorage.setItem('thoughts', JSON.stringify([{ id: 'a', title: 'Projekt', content: '', color: '#60a5fa' }]));
  render(<App />);
  fireEvent.press(await screen.findByLabelText('Podmyśli (0)'));
  expect(await screen.findByText('Brak podmyśli')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Dodaj podmyśl'));
  fireEvent.changeText(await screen.findByPlaceholderText('Tytuł myśli'), 'Etap 1');
  fireEvent.press(screen.getAllByLabelText('Wróć').slice(-1)[0]);
  expect(await screen.findByText('Etap 1')).toBeTruthy();
  await waitFor(async () => {
    const saved = JSON.parse((await AsyncStorage.getItem('thoughts')) ?? '[]');
    expect(saved.find((t: { title: string }) => t.title === 'Etap 1')).toMatchObject({ parentId: 'a' });
  });
});
