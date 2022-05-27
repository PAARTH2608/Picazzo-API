import React from "react";
import { View, Button } from "react-native";
const Home = ({ navigation }) => {
  return (
    <View>
      <Button title="First" onPress={() => navigation.navigate("First")} />
      <Button title="Second" onPress={() => navigation.navigate("Second")} />
    </View>
  );
};
export default Home;
