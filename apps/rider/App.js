import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const api = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};

export default function App() {
  const [online, setOnline] = useState(false);
  const [trip, setTrip] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const riderId = useRef(null);
  const poller = useRef(null);
  const stop = () => { if (poller.current) clearInterval(poller.current); poller.current = null; };
  useEffect(() => () => stop(), []);

  const find = async () => {
    try {
      const trips = await api('/trips?status=searching');
      if (trips[0]) setTrip(trips[0]);
    } catch (error) { stop(); Alert.alert('Could not reach MaraGo API', error.message); }
  };

  const goOnline = async () => {
    setLoading(true);
    try {
      const rider = await api('/users', { method: 'POST', body: JSON.stringify({ name: 'Ibrahim Musa', phone: '08000000001', role: 'rider' }) });
      riderId.current = rider.id;
      setOnline(true);
      await find();
      poller.current = setInterval(find, 3000);
    } catch (error) { Alert.alert('Could not go online', error.message); }
    finally { setLoading(false); }
  };

  const acceptTrip = async () => {
    setLoading(true);
    try {
      await api(`/trips/${trip.id}/accept`, { method: 'POST', body: JSON.stringify({ riderId: riderId.current }) });
      stop();
      setAccepted(true);
    } catch (error) { Alert.alert('Trip unavailable', error.message); setTrip(null); }
    finally { setLoading(false); }
  };

  const startTrip = async () => {
    setLoading(true);
    try {
      await api(`/trips/${trip.id}/start`, { method: 'POST' });
      setStarted(true);
    } catch (error) { Alert.alert('Could not start trip', error.message); }
    finally { setLoading(false); }
  };

  const completeTrip = async () => {
    setLoading(true);
    try {
      await api(`/trips/${trip.id}/complete`, { method: 'POST' });
      setCompleted(true);
      setTotalEarnings((prev) => prev + 850);
      setTripCount((prev) => prev + 1);
    } catch (error) { Alert.alert('Could not complete trip', error.message); }
    finally { setLoading(false); }
  };

  const goBackOnline = () => {
    setTrip(null); setAccepted(false); setStarted(false); setCompleted(false);
    poller.current = setInterval(find, 3000);
  };

  const goOffline = () => { stop(); setOnline(false); setTrip(null); setAccepted(false); setStarted(false); setCompleted(false); };

  /* ── COMPLETED ── */
  if (completed) return <SafeAreaView style={s.screen}><StatusBar style="dark"/>
    <Text style={s.brand}>Mara<Text style={s.orange}>Go</Text> <Text style={s.riderBadge}>RIDER</Text></Text>
    <View style={s.completeWrap}>
      <View style={s.checkCircle}><Text style={s.checkMark}>✓</Text></View>
      <Text style={s.title}>Trip completed!</Text>
      <Text style={s.muted}>You've earned</Text>
      <Text style={s.earningAmount}>₦850</Text>
      <View style={s.card}>
        <Text style={s.route}>●  {trip.pickup}</Text>
        <Text style={s.route}>◆  {trip.destination}</Text>
        <Text style={s.muted}>Amina Okafor • {trip.service}</Text>
      </View>
      <TouchableOpacity onPress={goBackOnline} style={s.button}><Text style={s.buttonText}>Go back online →</Text></TouchableOpacity>
    </View>
  </SafeAreaView>;

  /* ── TRIP IN PROGRESS ── */
  if (started) return <SafeAreaView style={s.screen}><StatusBar style="dark"/>
    <Text style={s.brand}>Mara<Text style={s.orange}>Go</Text> <Text style={s.riderBadge}>RIDER</Text></Text>
    <Text style={s.live}>● TRIP IN PROGRESS</Text>
    <Text style={s.title}>Drop-off: {trip.destination}</Text>
    <Text style={s.muted}>Ride safely. Customer: Amina Okafor.</Text>
    <View style={s.map}><Text style={s.bike}>⌁</Text></View>
    <View style={s.card}>
      <Text style={s.route}>●  {trip.pickup}</Text>
      <Text style={s.route}>◆  {trip.destination}</Text>
    </View>
    <TouchableOpacity disabled={loading} onPress={completeTrip} style={s.button}>{loading ? <ActivityIndicator color="#102126"/> : <Text style={s.buttonText}>Complete trip</Text>}</TouchableOpacity>
  </SafeAreaView>;

  /* ── HEADING TO PICKUP ── */
  if (accepted) return <SafeAreaView style={s.screen}><StatusBar style="dark"/>
    <Text style={s.brand}>Mara<Text style={s.orange}>Go</Text> <Text style={s.riderBadge}>RIDER</Text></Text>
    <Text style={s.live}>● ON THE WAY TO PICKUP</Text>
    <Text style={s.title}>Pickup: Amina</Text>
    <Text style={s.muted}>Head to {trip.pickup}. Customer is waiting.</Text>
    <View style={s.map}><Text style={s.bike}>⌁</Text></View>
    <TouchableOpacity disabled={loading} onPress={startTrip} style={s.button}>{loading ? <ActivityIndicator color="#102126"/> : <Text style={s.buttonText}>I have arrived — Start trip</Text>}</TouchableOpacity>
  </SafeAreaView>;

  /* ── NEW REQUEST ── */
  if (trip) return <SafeAreaView style={s.screen}><StatusBar style="dark"/>
    <Text style={s.brand}>Mara<Text style={s.orange}>Go</Text> <Text style={s.riderBadge}>RIDER</Text></Text>
    <Text style={s.live}>● NEW {trip.service.toUpperCase()} REQUEST</Text>
    <Text style={s.title}>{trip.service === 'ride' ? '₦850' : '₦1,000'}</Text>
    <Text style={s.muted}>Estimated earning • 4 min to pickup</Text>
    <View style={s.card}>
      <Text style={s.route}>●  {trip.pickup}</Text>
      <Text style={s.route}>◆  {trip.destination}</Text>
      <Text style={s.muted}>Amina Okafor • 4.8 ★</Text>
    </View>
    <TouchableOpacity disabled={loading} onPress={acceptTrip} style={s.button}>{loading ? <ActivityIndicator color="#102126"/> : <Text style={s.buttonText}>Accept {trip.service}</Text>}</TouchableOpacity>
    <TouchableOpacity onPress={() => setTrip(null)} style={s.secondary}><Text style={s.secondaryText}>Decline</Text></TouchableOpacity>
  </SafeAreaView>;

  /* ── WAITING FOR TRIPS ── */
  if (online) return <SafeAreaView style={s.screen}><StatusBar style="dark"/>
    <Text style={s.brand}>Mara<Text style={s.orange}>Go</Text> <Text style={s.riderBadge}>RIDER</Text></Text>
    <Text style={s.live}>● ONLINE</Text>
    <Text style={s.title}>Waiting for trips.</Text>
    <Text style={s.muted}>New ride and dispatch requests will appear here.</Text>
    <View style={s.map}><Text style={s.bike}>⌁</Text></View>
    <TouchableOpacity onPress={goOffline} style={s.secondary}><Text style={s.secondaryText}>Go offline</Text></TouchableOpacity>
  </SafeAreaView>;

  /* ── OFFLINE HOME ── */
  return <SafeAreaView style={s.screen}><StatusBar style="dark"/>
    <Text style={s.brand}>Mara<Text style={s.orange}>Go</Text> <Text style={s.riderBadge}>RIDER</Text></Text>
    <Text style={s.greeting}>Good morning, Ibrahim</Text>
    <Text style={s.title}>Ready to move?</Text>
    <TouchableOpacity disabled={loading} onPress={goOnline} style={s.button}>{loading ? <ActivityIndicator color="#102126"/> : <Text style={s.buttonText}>Go online</Text>}</TouchableOpacity>
    <View style={s.map}><Text>Go online to receive nearby requests.</Text><Text style={s.bike}>⌁</Text></View>
    <View style={s.earnings}>
      <Text style={s.earningLabel}>TODAY'S EARNINGS</Text>
      <Text style={s.money}>₦{totalEarnings.toLocaleString()}</Text>
      <Text style={s.earningLabel}>{tripCount} trip{tripCount !== 1 ? 's' : ''} completed</Text>
    </View>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, padding: 24, backgroundColor: '#f7f7f2' },
  brand: { fontSize: 25, fontWeight: '800' },
  orange: { color: '#ff6846' },
  riderBadge: { fontSize: 9, color: '#dfff53', backgroundColor: '#102126', paddingHorizontal: 4, paddingVertical: 2 },
  greeting: { marginTop: 45, color: '#677579', fontWeight: '600' },
  title: { marginVertical: 7, fontSize: 39, fontWeight: '800' },
  button: { marginTop: 22, backgroundColor: '#dfff53', padding: 16, borderRadius: 7, alignItems: 'center' },
  buttonText: { fontWeight: '800' },
  map: { height: 330, marginTop: 20, backgroundColor: '#e7efdb', alignItems: 'center', justifyContent: 'center', gap: 25, borderRadius: 9 },
  bike: { fontSize: 36, color: '#dfff53', backgroundColor: '#102126', padding: 13, borderRadius: 50 },
  earnings: { marginTop: 20, padding: 20, backgroundColor: '#102126', borderRadius: 8 },
  earningLabel: { fontSize: 10, color: '#aebeb8', fontWeight: '700' },
  money: { fontSize: 35, color: '#fff', fontWeight: '800', marginVertical: 5 },
  live: { marginTop: 55, color: '#358c77', fontSize: 11, fontWeight: '800' },
  muted: { color: '#677579' },
  card: { marginTop: 25, padding: 18, borderRadius: 8, backgroundColor: '#fff', gap: 13, width: '100%' },
  route: { fontWeight: '700' },
  secondary: { marginTop: 12, alignItems: 'center', padding: 10 },
  secondaryText: { color: '#d34e32', fontWeight: '700' },
  /* Complete */
  completeWrap: { flex: 1, alignItems: 'center', paddingTop: 40 },
  checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dfff53', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  checkMark: { fontSize: 30, fontWeight: '800' },
  earningAmount: { fontSize: 48, fontWeight: '800', color: '#2b8c6e', marginVertical: 12 },
});
