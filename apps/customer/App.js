import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const api = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};

export default function App() {
  const [service, setService] = useState('ride');
  const [pickup, setPickup] = useState('Mararaba Park');
  const [destination, setDestination] = useState('');
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const poller = useRef(null);
  const stopPolling = () => { if (poller.current) clearInterval(poller.current); poller.current = null; };
  useEffect(() => () => stopPolling(), []);

  const watchTrip = (id) => {
    stopPolling();
    poller.current = setInterval(async () => {
      try { setTrip(await api(`/trips/${id}`)); } catch { stopPolling(); }
    }, 3000);
  };

  const createTrip = async () => {
    setLoading(true);
    try {
      const customer = await api('/users', { method: 'POST', body: JSON.stringify({ name: 'Amina Okafor', phone: '08000000000', role: 'customer' }) });
      const newTrip = await api('/trips', { method: 'POST', body: JSON.stringify({ customerId: customer.id, service, pickup, destination }) });
      setTrip(newTrip); watchTrip(newTrip.id);
    } catch (error) { Alert.alert('Could not request a rider', `${error.message}\n\nCheck the local API is running and the phone uses your computer's IP address.`); }
    finally { setLoading(false); }
  };

  const cancelTrip = async () => {
    if (!trip) return;
    try { await api(`/trips/${trip.id}/cancel`, { method: 'POST' }); } catch {}
    stopPolling(); setTrip(null);
  };

  const resetForNewTrip = () => {
    stopPolling();
    setTrip(null);
    setDestination('');
    setRating(0);
  };

  const status = trip?.status;
  const assigned = status === 'rider_assigned';
  const inProgress = status === 'in_progress';
  const completed = status === 'completed';

  /* ── COMPLETED ── */
  if (completed) return <SafeAreaView style={s.screen}><StatusBar style="dark" />
    <Text style={s.brand}>Mara<Text style={s.orange}>Go</Text></Text>
    <View style={s.completeWrap}>
      <View style={s.checkCircle}><Text style={s.checkMark}>✓</Text></View>
      <Text style={s.title}>Trip complete!</Text>
      <Text style={s.muted}>{trip.pickup} → {trip.destination}</Text>
      <View style={s.fareCard}><Text>Trip fare</Text><Text style={s.fareAmount}>₦{trip.fare?.max || 850}</Text></View>
      <View style={s.rider}><Text style={s.avatar}>IM</Text><View><Text style={s.serviceTitle}>Ibrahim Musa</Text><Text style={s.muted}>Honda Ace • 4.9 ★</Text></View></View>
      <Text style={s.rateLabel}>How was your trip?</Text>
      <View style={s.stars}>{[1,2,3,4,5].map(n => <TouchableOpacity key={n} onPress={() => setRating(n)}><Text style={[s.star, n <= rating && s.starFilled]}>★</Text></TouchableOpacity>)}</View>
      <TouchableOpacity onPress={resetForNewTrip} style={s.button}><Text style={s.buttonText}>Done — Book another trip</Text></TouchableOpacity>
    </View>
  </SafeAreaView>;

  /* ── IN PROGRESS ── */
  if (inProgress) return <SafeAreaView style={s.screen}><StatusBar style="dark" />
    <Text style={s.brand}>Mara<Text style={s.orange}>Go</Text></Text>
    <View style={s.map}><Text style={s.mapText}>Trip in progress</Text><Text style={s.bike}>⌁</Text></View>
    <Text style={s.live}>● TRIP IN PROGRESS</Text>
    <Text style={s.title}>You're on your way!</Text>
    <Text style={s.muted}>Enjoy the ride. Your driver knows the way.</Text>
    <View style={s.rider}><Text style={s.avatar}>IM</Text><View><Text style={s.serviceTitle}>Ibrahim Musa</Text><Text style={s.muted}>Honda Ace • ABC 123 DE • 4.9 ★</Text></View></View>
  </SafeAreaView>;

  /* ── TRACKING: searching or rider_assigned ── */
  if (trip) return <SafeAreaView style={s.screen}><StatusBar style="dark" />
    <Text style={s.brand}>Mara<Text style={s.orange}>Go</Text></Text>
    <View style={s.map}><Text style={s.mapText}>{assigned ? 'Your rider is 3 mins away' : 'Finding a nearby rider…'}</Text><Text style={s.bike}>⌁</Text></View>
    <Text style={s.live}>● {assigned ? 'RIDER IS ON THE WAY' : 'SEARCHING FOR A RIDER'}</Text>
    <Text style={s.title}>{assigned ? 'Your trip is moving.' : "We're finding your rider."}</Text>
    <Text style={s.muted}>{assigned ? 'Ibrahim has accepted your trip.' : 'Keep this screen open while we match you.'}</Text>
    <View style={s.rider}><Text style={s.avatar}>IM</Text><View><Text style={s.serviceTitle}>{assigned ? 'Ibrahim Musa' : 'MaraGo rider matching'}</Text><Text style={s.muted}>{assigned ? 'Honda Ace • 4.9 ★' : `${trip.service} • ${trip.pickup}`}</Text></View></View>
    <TouchableOpacity onPress={cancelTrip} style={s.cancel}><Text style={s.cancelText}>Cancel request</Text></TouchableOpacity>
  </SafeAreaView>;

  /* ── BOOKING ── */
  return <SafeAreaView style={s.screen}><StatusBar style="dark" />
    <Text style={s.brand}>Mara<Text style={s.orange}>Go</Text></Text><Text style={s.greeting}>Good morning, Amina 👋</Text><Text style={s.title}>Where are you{`\n`}headed today?</Text>
    <View style={s.services}>{['ride', 'dispatch'].map((item) => <TouchableOpacity key={item} onPress={() => setService(item)} style={[s.service, service === item && s.selected]}><Text style={s.serviceTitle}>{item === 'ride' ? '⌁  Bike ride' : '□  Dispatch'}</Text><Text style={s.muted}>{item === 'ride' ? 'Move yourself' : 'Send a package'}</Text></TouchableOpacity>)}</View>
    <View style={s.form}><TextInput value={pickup} onChangeText={setPickup} placeholder="Pickup location" style={s.input}/><TextInput value={destination} onChangeText={setDestination} placeholder="Where are you going?" style={s.input}/></View>
    <View style={s.fare}><Text>Estimated fare</Text><Text style={s.price}>{service === 'ride' ? '₦700 – ₦1,000' : '₦800 – ₦1,200'}</Text></View>
    <TouchableOpacity disabled={!destination || loading} onPress={createTrip} style={[s.button, (!destination || loading) && s.disabled]}>{loading ? <ActivityIndicator color="#102126"/> : <Text style={s.buttonText}>Find a rider  →</Text>}</TouchableOpacity>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, padding: 24, backgroundColor: '#f7f7f2' },
  brand: { fontSize: 25, fontWeight: '800' },
  orange: { color: '#ff6846' },
  greeting: { marginTop: 42, color: '#677579', fontWeight: '600' },
  title: { fontSize: 37, lineHeight: 39, fontWeight: '800', marginVertical: 6 },
  services: { flexDirection: 'row', gap: 10, marginVertical: 28 },
  service: { flex: 1, padding: 13, borderRadius: 8, borderWidth: 1, borderColor: '#dce3df', backgroundColor: '#fff' },
  selected: { borderWidth: 2, borderColor: '#102126', backgroundColor: '#f1ffbd' },
  serviceTitle: { fontWeight: '700' },
  muted: { color: '#677579', fontSize: 12, marginTop: 3 },
  form: { padding: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#dce3df' },
  input: { height: 49, borderBottomWidth: 1, borderColor: '#dce3df' },
  fare: { marginTop: 18, padding: 17, borderRadius: 8, backgroundColor: '#e7f5ed', flexDirection: 'row', justifyContent: 'space-between' },
  price: { fontWeight: '800', fontSize: 17 },
  button: { marginTop: 14, backgroundColor: '#dfff53', padding: 16, borderRadius: 7, alignItems: 'center' },
  disabled: { opacity: .45 },
  buttonText: { fontWeight: '800' },
  map: { height: 390, marginHorizontal: -24, backgroundColor: '#e7efdb', alignItems: 'center', justifyContent: 'center' },
  mapText: { position: 'absolute', top: 28, backgroundColor: '#fff', padding: 10, borderRadius: 5, fontWeight: '700' },
  bike: { fontSize: 38, color: '#dfff53', backgroundColor: '#102126', padding: 15, borderRadius: 50 },
  live: { marginTop: 30, color: '#358c77', fontSize: 11, fontWeight: '800' },
  rider: { marginTop: 22, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#dce3df', flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { backgroundColor: '#f5bd97', padding: 12, borderRadius: 50, fontWeight: '800' },
  cancel: { marginTop: 20, alignItems: 'center' },
  cancelText: { color: '#d1482c', fontWeight: '700' },
  /* Complete screen */
  completeWrap: { flex: 1, alignItems: 'center', paddingTop: 40 },
  checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dfff53', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  checkMark: { fontSize: 30, fontWeight: '800' },
  fareCard: { marginTop: 24, padding: 18, borderRadius: 8, backgroundColor: '#e7f5ed', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  fareAmount: { fontSize: 26, fontWeight: '800' },
  rateLabel: { marginTop: 24, color: '#677579', fontSize: 13 },
  stars: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 20 },
  star: { fontSize: 32, color: '#d6dfda' },
  starFilled: { color: '#f5b731' },
});
