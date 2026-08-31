import { types } from "cassandra-driver";

export const randomUuid = () => types.Uuid.random();

export const parseUuid = (value) => {
    if (value instanceof types.Uuid) {
        return value;
    }

    return types.Uuid.fromString(String(value));
};

export const uuidToString = (value) => {
    if (value == null) {
        return null;
    }

    return String(value);
};
