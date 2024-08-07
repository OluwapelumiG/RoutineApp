import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

const App = () => {
  const [activity, setActivity] = useState('');
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadActivities();
    registerForPushNotificationsAsync();
    const notificationListener = Notifications.addNotificationReceivedListener(handleNotification);
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
    };
  }, []);

  const loadActivities = async () => {
    try {
      const savedActivities = await AsyncStorage.getItem('activities');
      console.log('Loaded activities:', savedActivities); // Debug line
      if (savedActivities) {
        setActivities(JSON.parse(savedActivities));
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const saveActivities = async (activities) => {
    try {
      console.log('Saving activities:', activities); // Debug line
      await AsyncStorage.setItem('activities', JSON.stringify(activities));
      loadActivities();
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  };

  const addActivity = () => {
    if (!activity || !time) return;

    const newActivity = {
      id: Date.now().toString(),
      activity,
      time: time.toISOString(),
      done: false,
    };

    const updatedActivities = [...activities, newActivity];
    // setActivities(updatedActivities);
    saveActivities(updatedActivities).catch(console.error);
    scheduleNotification(newActivity).catch(console.error);
    setActivity('');
    setTime(new Date());
    setShowPicker(false);
  };

  const deleteActivity = (id) => {
    const updatedActivities = activities.filter(item => item.id !== id);
    // setActivities(updatedActivities);
    saveActivities(updatedActivities).catch(console.error);
  };

  const markAsDone = (id) => {
    const updatedActivities = activities.map(item =>
      item.id === id ? { ...item, done: true } : item
    );
    // setActivities(updatedActivities);
    saveActivities(updatedActivities).catch(console.error);
  };

  const snoozeActivity = async (id) => {
    try {
      const updatedActivities = activities.map(item =>
        item.id === id ? { ...item, time: new Date(new Date(item.time).getTime() + 5 * 60000).toISOString() } : item
      );
      console.log("Activities", updatedActivities);
      // setActivities(updatedActivities);
      await saveActivities(updatedActivities);
      const snoozedActivity = updatedActivities.find(item => item.id === id);
      if (snoozedActivity) {
        await scheduleNotification(snoozedActivity);
      }
    } catch (error) {
      console.error('Error snoozing activity:', error);
    }
  };

  const scheduleNotification = async (activity) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Activity Reminder',
        body: `It's time to: ${activity.activity}`,
        data: { id: activity.id },
      },
      trigger: new Date(activity.time),
    });
  };

  const handleNotification = (notification) => {
    const { id } = notification.request.content.data;
    Alert.alert(
      'Activity Reminder',
      notification.request.content.body,
      [
        { text: 'Snooze', onPress: () => snoozeActivity(id).catch(console.error) },
        { text: 'Done', onPress: () => markAsDone(id) },
      ]
    );
  };

  const registerForPushNotificationsAsync = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  };

  return (
    <View style={styles.container}>
      <Title>Routine Management App</Title>
      <TextInput
        placeholder="Activity"
        value={activity}
        onChangeText={setActivity}
        style={styles.input}
      />
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
        <Text style={styles.dateButtonText}>{time.toLocaleTimeString()}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          mode="time"
          value={time}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            setTime(selectedDate || time);
          }}
        />
      )}
      <Button mode="contained" onPress={addActivity} style={styles.addButton}>
        Add Activity
      </Button>
      <FlatList
        data={activities}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={item.done ? styles.doneText : styles.activityText}>{item.activity}</Title>
              <Paragraph>{new Date(item.time).toLocaleTimeString()}</Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => deleteActivity(item.id)} style={styles.deleteButton}>Delete</Button>
              {!item.done && <Button onPress={() => markAsDone(item.id)}>Done</Button>}
            </Card.Actions>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  dateButton: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    color: '#000',
  },
  addButton: {
    marginBottom: 20,
  },
  card: {
    marginBottom: 10,
  },
  activityText: {
    fontSize: 16,
  },
  doneText: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    color: '#888',
  },
  deleteButton: {
    color: 'red',
  },
});

export default App;
