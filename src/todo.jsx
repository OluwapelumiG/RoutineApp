import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export default function Todo() {
  const [todo, setTodo] = useState('');
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const storedTodos = await AsyncStorage.getItem('todos');
      if (storedTodos) setTodos(JSON.parse(storedTodos));
    } catch (e) {
      console.error(e);
    }
  };

  const saveTodos = async (todos) => {
    try {
      await AsyncStorage.setItem('todos', JSON.stringify(todos));
    } catch (e) {
      console.error(e);
    }
  };

  const addTodo = () => {
    const newTodos = [...todos, { id: Date.now().toString(), text: todo, done: false }];
    setTodos(newTodos);
    if(id && text){
      setTodo('');
      saveTodos(newTodos);
      scheduleNotification(todo);
    }
    else{
      alert('You must enter task and select time');
    }
     // Schedule notification when a task is added
  };

  const toggleDone = (id) => {
    const newTodos = todos.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  const scheduleNotification = async (todo) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Reminder",
        body: `It's time to: ${todo}`,
        sound: 'default',
      },
      trigger: { seconds: 5 }, // adjust as necessary
    });
  };

  const snoozeNotification = async (todo) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Reminder",
        body: `It's time to: ${todo}`,
        sound: 'default',
      },
      trigger: { seconds: 300 }, // Snooze for 5 minutes
    });
  };

  const handleSnooze = (todo) => {
    Alert.alert(
      "Snooze Task",
      `Do you want to snooze the task: "${todo}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Snooze",
          onPress: () => snoozeNotification(todo)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={todo}
        onChangeText={setTodo}
        placeholder="Enter a task"
      />
      <Button title="Add To-Do" onPress={addTodo} />
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.todo}>
            <Text style={{ textDecorationLine: item.done ? 'line-through' : 'none' }}>
              {item.text}
            </Text>
            <View style={styles.buttonContainer}>
              <Button title="Snooze" onPress={() => handleSnooze(item.text)} />
              <Button title={item.done ? "Undo" : "Done"} onPress={() => toggleDone(item.id)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 8,
  },
  todo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
});
