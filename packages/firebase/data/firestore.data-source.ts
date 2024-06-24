import firebase from 'firebase/app';
import {
    DeleteDataSource,
    GetDataSource,
    IdQuery,
    NotFoundError,
    PutDataSource,
    Query,
    QueryNotSupportedError,
} from '@mobilejazz/harmony-core';

import { FirestoreIncrementQuery, FirestoreCreateDocumentQuery } from './firestore.query';
import { FirestoreEntity } from './firestore.entity';

export class FirestoreDataSource<T>
    implements GetDataSource<FirestoreEntity<T>>, PutDataSource<FirestoreEntity<T>>, DeleteDataSource
{
    protected collection: firebase.firestore.CollectionReference;

    constructor(protected collectionName: string, protected firestore: firebase.firestore.Firestore) {
        this.collection = this.firestore.collection(collectionName);
    }

    protected async findOne(query: firebase.firestore.Query): Promise<FirestoreEntity<T>> {
        const result = await query.limit(1).get();

        if (!result.empty) {
            const doc = result.docs[0];

            return {
                id: doc.id,
                data: doc.data() as T,
            };
        } else {
            throw new NotFoundError();
        }
    }

    async get(query: Query): Promise<FirestoreEntity<T>> {
        if (query instanceof IdQuery) {
            const doc = await this.collection.doc(query.id).get();

            if (doc.exists) {
                return {
                    id: doc.id,
                    data: doc.data() as T,
                };
            } else {
                throw new NotFoundError();
            }
        }

        throw new QueryNotSupportedError();
    }

    getAll(query: Query): Promise<FirestoreEntity<T>[]> {
        throw new QueryNotSupportedError();
    }

    delete(query: Query): Promise<void> {
        throw new QueryNotSupportedError();
    }

    deleteAll(query: Query): Promise<void> {
        throw new QueryNotSupportedError();
    }

    async put(value: FirestoreEntity<T>, query: Query): Promise<FirestoreEntity<T>> {
        if (query instanceof IdQuery) {
            const ref = this.collection.doc(query.id);
            const doc = await ref.get();

            if (doc.exists) {
                await ref.update(value.data);
            } else {
                await ref.set(value.data);
            }

            return {
                id: doc.id,
                data: doc.data() as T,
            };
        } else if (query instanceof FirestoreCreateDocumentQuery) {
            if (value.id) {
                const ref = this.collection.doc(value.id);
                await ref.set(value.data);

                return value;
            } else {
                const ref = await this.collection.add(value.data);
                const doc = await ref.get();

                return {
                    id: doc.id,
                    data: doc.data() as T,
                };
            }
        } else if (query instanceof FirestoreIncrementQuery) {
            const increment = firebase.firestore.FieldValue.increment(query.amount);
            const userRef = this.collection.doc(value.id);
            const data = {};

            // Build udpate "instructions"
            data[query.field] = increment;

            await userRef.update(data);

            return value;
        }

        throw new QueryNotSupportedError();
    }

    putAll(values: FirestoreEntity<T>[], query: Query): Promise<FirestoreEntity<T>[]> {
        throw new QueryNotSupportedError();
    }
}
