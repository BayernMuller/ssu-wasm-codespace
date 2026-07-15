#include <pthread.h>

#include <algorithm>
#include <cstddef>
#include <vector>

namespace {

constexpr int kMaximumWorkers = 4;

struct SumTask {
    const float* values;
    std::size_t begin;
    std::size_t end;
    double result;
};

void* sum_range(void* raw_task) {
    auto* task = static_cast<SumTask*>(raw_task);
    double total = 0.0;
    for (std::size_t i = task->begin; i < task->end; ++i) {
        total += task->values[i];
    }
    task->result = total;
    return nullptr;
}

double scalar_sum(const float* values, std::size_t length) {
    double total = 0.0;
    for (std::size_t i = 0; i < length; ++i) {
        total += values[i];
    }
    return total;
}

}  // namespace

extern "C" double parallel_sum_f32(
    const float* values,
    std::size_t length,
    int requested_workers
) {
    if (values == nullptr || length == 0) {
        return 0.0;
    }

    const int worker_count = std::clamp(
        requested_workers,
        1,
        static_cast<int>(std::min<std::size_t>(length, kMaximumWorkers))
    );
    if (worker_count == 1) {
        return scalar_sum(values, length);
    }

    std::vector<SumTask> tasks(static_cast<std::size_t>(worker_count));
    std::vector<pthread_t> threads(static_cast<std::size_t>(worker_count));
    int created = 0;

    for (int i = 0; i < worker_count; ++i) {
        auto& task = tasks[static_cast<std::size_t>(i)];
        const auto begin =
            length * static_cast<std::size_t>(i) /
            static_cast<std::size_t>(worker_count);
        const auto end =
            length * static_cast<std::size_t>(i + 1) /
            static_cast<std::size_t>(worker_count);
        task = SumTask{
            values,
            begin,
            end,
            0.0,
        };

        if (pthread_create(
                &threads[static_cast<std::size_t>(i)],
                nullptr,
                sum_range,
                &task
            ) != 0) {
            for (int j = 0; j < created; ++j) {
                pthread_join(threads[static_cast<std::size_t>(j)], nullptr);
            }
            return scalar_sum(values, length);
        }
        ++created;
    }

    double total = 0.0;
    for (int i = 0; i < worker_count; ++i) {
        pthread_join(threads[static_cast<std::size_t>(i)], nullptr);
        // join completes before the calling thread reads this task's result.
        total += tasks[static_cast<std::size_t>(i)].result;
    }
    return total;
}
