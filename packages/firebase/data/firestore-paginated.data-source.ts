import firebase from 'firebase/app';
import { GetDataSource, PaginationPage, Query, QueryNotSupportedError } from '@mobilejazz/harmony-core';

import { FirestoreEntity } from './firestore.entity';
import { FirestorePaginationNextQuery, FirestorePaginationPreviousQuery } from './firestore.query';

export class FirestorePage<T> extends PaginationPage<T> {
    constructor(
        values: T[],
        page: number,
        size: number,
        readonly firstDoc: firebase.firestore.DocumentSnapshot,
        readonly lastDoc: firebase.firestore.DocumentSnapshot,
    ) {
        super(values, page, size);
    }
}

export class FirestorePaginatedDataSource<T> implements GetDataSource<FirestorePage<FirestoreEntity<T>>> {
    protected collection: firebase.firestore.CollectionReference;

    constructor(protected collectionName: string, protected firestore: firebase.firestore.Firestore) {
        this.collection = this.firestore.collection(collectionName);
    }

    public async get(query: Query): Promise<FirestorePage<FirestoreEntity<T>>> {
        if (query instanceof FirestorePaginationNextQuery || query instanceof FirestorePaginationPreviousQuery) {
            let fsQuery: firebase.firestore.Query<firebase.firestore.DocumentData>;

            // Check if `doc<id>` filter is present
            const idFilter = (query.filterBy || []).find(f => f.fieldPath === 'doc<id>');
            const hasIdFilter = idFilter !== undefined;

            if (hasIdFilter) {
                const doc = await this.collection.doc(idFilter.value).get();
                const entity = { id: doc.id, data: doc.data() as T };

                if (doc.exists) {
                    return new FirestorePage([entity], query.page, query.size, doc, doc);
                } else {
                    return new FirestorePage([], query.page, query.size, undefined, undefined);
                }
            }

            // Order
            if (query.orderBy) {
                const filters = query.filterBy ?? [];
                const isOrderInFilter = filters.some(f => f.fieldPath === query.orderBy.field);

                // If inequality filters are applied (e.g. for searching on a field that starts by a word) then
                // the first `orderBy`, if present, must be on the same field that it's being filtered. Which makes `orderBy` useless.
                // That's why if there is an inequality filter we ignore ordering. Firebase rulez. -_-
                const hasInequalityFilter = filters.some(f => ['<', '<=', '>', '>='].includes(f.opStr));

                // Apply order only if we're not filtering on the same field
                if (!isOrderInFilter && !hasInequalityFilter) {
                    fsQuery = this.collection.orderBy(query.orderBy.field, query.orderBy.direction);
                }
            }

            if (query instanceof FirestorePaginationNextQuery) {
                fsQuery = (fsQuery ? fsQuery : this.collection).limit(query.size);

                (query.filterBy || []).forEach(f => {
                    fsQuery = fsQuery.where(f.fieldPath, f.opStr, f.value);
                });

                if (query.lastDoc) {
                    fsQuery = fsQuery.startAfter(query.lastDoc);
                }
            } else if (query instanceof FirestorePaginationPreviousQuery) {
                fsQuery = (fsQuery ? fsQuery : this.collection).limitToLast(query.size);

                (query.filterBy || []).forEach(f => {
                    fsQuery = fsQuery.where(f.fieldPath, f.opStr, f.value);
                });

                if (query.firstDoc) {
                    fsQuery = fsQuery.endBefore(query.firstDoc);
                }
            }

            // Get
            const entries = await fsQuery.get();
            const values = entries.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => {
                return { id: doc.id, data: doc.data() as T };
            });

            if (values.length) {
                return new FirestorePage(
                    values,
                    query.page,
                    query.size,
                    entries.docs[0],
                    entries.docs[entries.docs.length - 1],
                );
            } else {
                return new FirestorePage(values, query.page, query.size, undefined, undefined);
            }
        }

        throw new QueryNotSupportedError();
    }

    public getAll(query: Query): Promise<FirestorePage<FirestoreEntity<T>>[]> {
        throw new QueryNotSupportedError();
    }
}
