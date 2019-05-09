import { Mapper, Query, VoidQuery } from '..';
import { DeleteDataSource, GetDataSource, PutDataSource } from './data-source';

/**
 * This data source uses mappers to map objects and redirects them to the contained data source, acting as a simple "translator".
 *
 * @param getDataSource Data source with get operations
 * @param putDataSource Data source with put operations
 * @param deleteDataSource Data source with delete operations
 * @param toOutMapper Mapper to map data source objects to repository objects
 * @param toInMapper Mapper to map repository objects to data source objects
 */
export class DataSourceMapper<In, Out> implements GetDataSource<Out>, PutDataSource<Out>, DeleteDataSource {
    private getDataSource: GetDataSource<In>;
    private putDataSource: PutDataSource<In>;
    private deleteDataSource: DeleteDataSource;
    private toOutMapper: Mapper<In, Out>;
    private toInMapper: Mapper<Out, In>;

    constructor(
        getDataSource: GetDataSource<In>,
        putDataSource: PutDataSource<In>,
        deleteDataSource: DeleteDataSource,
        toOutMapper: Mapper<In, Out>,
        toInMapper: Mapper<Out, In>,
    ) {
        this.getDataSource = getDataSource;
        this.putDataSource = putDataSource;
        this.deleteDataSource = deleteDataSource;
        this.toOutMapper = toOutMapper;
        this.toInMapper = toInMapper;
    }

    public get(query: Query): Promise<Out>;
    public get<K>(id: K): Promise<Out>;
    public async get<K>(queryOrId: Query | K): Promise<Out> {
        let result: In = await this.getDataSource.get(queryOrId);
        return this.toOutMapper.map(result);
    }

    public getAll(query: Query): Promise<Out[]>;
    public getAll<K>(ids: K[]): Promise<Out[]>;
    public async getAll<K>(queryOrIds: Query | K[]): Promise<Out[]> {
        let results: In[] = await this.getDataSource.getAll(queryOrIds);
        return results.map((r: In) => this.toOutMapper.map(r));
    }

    public put(value: Out, query?: Query): Promise<Out>;
    public put<K>(value: Out, id?: K): Promise<Out>;
    public async put<K>(value: Out, queryOrId: Query | K = new VoidQuery()): Promise<Out> {
        let mapped: In  = this.toInMapper.map(value);
        let result: In = await this.putDataSource.put(mapped, queryOrId);
        return this.toOutMapper.map(result);
    }

    public putAll(values: Out[], query?: Query): Promise<Out[]>;
    public putAll<K>(values: Out[], ids?: K[]): Promise<Out[]>;
    public async putAll<K>(values: Out[], queryOrIds: Query | K[] = new VoidQuery()): Promise<Out[]> {
        let mapped: In[]  = this.toInMapper.map(values);
        let results: In[] = await this.putDataSource.putAll(mapped, queryOrIds);
        return results.map((r: In) => this.toOutMapper.map(r));
    }

    public delete(query: Query): Promise<boolean>;
    public delete<K>(id: K): Promise<boolean>;
    public async delete<K>(queryOrId: Query | K): Promise<boolean> {
        return this.deleteDataSource.delete(queryOrId);
    }

    public deleteAll(query: Query): Promise<boolean>;
    public deleteAll<K>(ids: K[]): Promise<boolean>;
    public async deleteAll<K>(queryOrIds: Query | K[]): Promise<boolean> {
        return this.deleteDataSource.deleteAll(queryOrIds);
    }
}
