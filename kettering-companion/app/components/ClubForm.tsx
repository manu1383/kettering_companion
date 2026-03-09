import { StyleSheet, TextInput } from "react-native";

interface Props {
    name: string;
    setName: (v: string) => void;

    description: string;
    setDescription: (v: string) => void;

    location: string;
    setLocation: (v: string) => void;

    contactEmail: string;
    setContactEmail: (v: string) => void;
}

export default function ClubForm({
    name,
    setName,
    description,
    setDescription,
    location,
    setLocation,
    contactEmail,
    setContactEmail
}: Props) {
  return (
    <>
      <TextInput
        style={styles.input}
        placeholder="Club Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />

      <TextInput
        style={styles.input}
        placeholder="Contact Email"
        value={contactEmail}
        onChangeText={setContactEmail}
      />
    </>
  );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 15
    }
});